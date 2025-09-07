'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Reorder, motion, AnimatePresence} from 'framer-motion';
import {
    ArrowUp,
    ArrowDown,
    Trash2,
    Pencil,
    MoreVertical,
    ChevronRight,
    Plus,
    X,
    Pin,
    PinOff,
} from 'lucide-react';
import {createPortal} from 'react-dom';
import {api} from '../utils/api';

export interface AccountRow {
    id: string;
    accountName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status?: 'active' | 'inactive' | '';
    servicesCount: number;
    enterpriseName?: string;
    productName?: string;
    serviceName?: string;
    servicesSummary?: string;
    globalClientName?: string;
    address?: {
        addressLine1?: string;
        addressLine2?: string;
        country?: string;
        state?: string;
        city?: string;
        pincode?: string;
    };
    technical?: {
        username?: string;
        email?: string;
    };
    licenses?: Array<{
        enterprise?: string;
        product?: string;
        service?: string;
        licenseStart?: string;
        licenseEnd?: string;
        users?: number;
        renewalNotice?: boolean;
        noticeDays?: number;
        emailTemplate?: string;
        contacts?: Array<{
            contact?: string;
            title?: string;
            email?: string;
            phone?: string;
        }>;
    }>;
}

function InlineEditableText({
    value,
    onCommit,
    placeholder,
    renderDisplay,
    className,
    dataAttr,
    onTabNext,
    onTabPrev,
}: {
    value: string;
    onCommit: (next: string) => void;
    placeholder?: string;
    renderDisplay?: (v: string) => React.ReactNode;
    className?: string;
    dataAttr?: string;
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState<string>(value || '');
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (!editing) setDraft(value || '');
    }, [value, editing]);
    React.useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const commit = () => {
        const next = (draft || '').trim();
        if (next !== (value || '')) onCommit(next);
        setEditing(false);
    };
    const cancel = () => {
        setDraft(value || '');
        setEditing(false);
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') cancel();
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const next = (draft || '').trim();
                        if (next !== (value || '')) onCommit(next);
                        setEditing(false);
                        if (e.shiftKey) onTabPrev && onTabPrev();
                        else onTabNext && onTabNext();
                    }
                }}
                placeholder={placeholder}
                className={`min-w-0 w-full rounded-sm border border-slate-300 bg-white px-1 py-0.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                    className || ''
                }`}
                data-inline={dataAttr || undefined}
            />
        );
    }
    const isEmpty = !value || value.length === 0;
    return (
        <span
            className={`group/ie inline-flex min-w-0 items-center truncate rounded-sm px-1 -mx-1 -my-0.5 hover:ring-1 hover:ring-slate-300 hover:bg-white/60 cursor-text ${
                className || ''
            }`}
            onClick={() => setEditing(true)}
            title={(value || '').toString()}
            data-inline={dataAttr || undefined}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    setEditing(true);
                }
                if (e.key === 'Tab') {
                    // Let browser move focus naturally between cells when not editing
                }
            }}
        >
            {renderDisplay ? (
                renderDisplay(value || '')
            ) : isEmpty && placeholder ? (
                <span className='text-slate-400 italic'>{placeholder}</span>
            ) : (
                value || ''
            )}
        </span>
    );
}

type CatalogType = 'enterprise' | 'product' | 'service' | 'template';

function AsyncChipSelect({
    type,
    value,
    onChange,
    placeholder,
    compact,
}: {
    type: CatalogType;
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    compact?: boolean;
}) {
    const [open, setOpen] = React.useState(false);
    const [current, setCurrent] = React.useState<string | undefined>(value);
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<{id: string; name: string}[]>(
        [],
    );
    const [loading, setLoading] = React.useState(false);
    const [adding, setAdding] = React.useState('');
    const [showAdder, setShowAdder] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);
    // Inline adder inside dropdown (no separate portal positioning)

    const loadOptions = React.useCallback(async () => {
        setLoading(true);
        try {
            if (type === 'product') {
                const data = await api.get<Array<{id: string; name: string}>>(
                    `/api/products${
                        query ? `?search=${encodeURIComponent(query)}` : ''
                    }`,
                );
                setOptions(data || []);
            } else if (type === 'service') {
                const data = await api.get<Array<{id: string; name: string}>>(
                    `/api/services${
                        query ? `?search=${encodeURIComponent(query)}` : ''
                    }`,
                );
                setOptions(data || []);
            } else if (type === 'template') {
                // reuse products API for templates, or switch to dedicated endpoint if available
                const data = await api.get<Array<{id: string; name: string}>>(
                    `/api/products${
                        query ? `?search=${encodeURIComponent(query)}` : ''
                    }`,
                );
                setOptions(data || []);
            } else {
                const ents = await api.get<Array<{id: string; name: string}>>(
                    '/api/enterprises',
                );
                const filtered = (ents || []).filter((e) =>
                    query
                        ? e.name.toLowerCase().includes(query.toLowerCase())
                        : true,
                );
                setOptions(filtered);
            }
        } catch (_e) {
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [type, query]);

    React.useEffect(() => {
        if (!open) return;
        loadOptions();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const width = 256;
            const left = Math.max(
                8,
                Math.min(window.innerWidth - width - 8, rect.left),
            );
            const top = Math.min(window.innerHeight - 16, rect.bottom + 8);
            setDropdownPos({top, left, width});
        }
    }, [open, loadOptions]);
    // Note: search filters locally; do not refetch on query

    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen(false);
                setShowAdder(false);
                setAdding('');
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const addNew = async () => {
        const name = (adding || query || '').trim();
        if (!name) return;
        try {
            let created: {id: string; name: string} | null = null;
            if (type === 'product') {
                created = await api.post<{id: string; name: string}>(
                    '/api/products',
                    {name},
                );
            } else if (type === 'service') {
                created = await api.post<{id: string; name: string}>(
                    '/api/services',
                    {name},
                );
            } else if (type === 'template') {
                created = await api.post<{id: string; name: string}>(
                    '/api/products',
                    {name},
                );
            } else {
                created = await api.post<{id: string; name: string}>(
                    '/api/enterprises',
                    {name},
                );
            }
            if (created) {
                // Inject newly created into the current dropdown list and hide the input
                setOptions((prev) => {
                    const exists = prev.some((o) => o.id === created!.id);
                    return exists ? prev : [...prev, created!];
                });
                setShowAdder(false);
                setAdding('');
                setQuery('');
            }
        } catch (_e) {
            // no-op
        }
    };

    React.useEffect(() => {
        setCurrent(value);
    }, [value]);

    const sizeClass = compact ? 'text-[11px] py-0.5' : 'text-[12px] py-1';
    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%'}}
        >
            {current || value ? (
                (() => {
                    const key = (current || value || '').toLowerCase();
                    let hash = 0;
                    for (let i = 0; i < key.length; i++) {
                        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
                    }
                    const palettes: Record<
                        CatalogType,
                        {
                            bg: string;
                            text: string;
                            border: string;
                            dot: string;
                        }[]
                    > = {
                        product: [
                            {
                                bg: 'bg-violet-50',
                                text: 'text-violet-800',
                                border: 'border-violet-200',
                                dot: 'bg-violet-400',
                            },
                            {
                                bg: 'bg-sky-50',
                                text: 'text-sky-800',
                                border: 'border-sky-200',
                                dot: 'bg-sky-400',
                            },
                            {
                                bg: 'bg-emerald-50',
                                text: 'text-emerald-800',
                                border: 'border-emerald-200',
                                dot: 'bg-emerald-400',
                            },
                            {
                                bg: 'bg-amber-50',
                                text: 'text-amber-800',
                                border: 'border-amber-200',
                                dot: 'bg-amber-400',
                            },
                        ],
                        service: [
                            {
                                bg: 'bg-rose-50',
                                text: 'text-rose-800',
                                border: 'border-rose-200',
                                dot: 'bg-rose-400',
                            },
                            {
                                bg: 'bg-indigo-50',
                                text: 'text-indigo-800',
                                border: 'border-indigo-200',
                                dot: 'bg-indigo-400',
                            },
                            {
                                bg: 'bg-teal-50',
                                text: 'text-teal-800',
                                border: 'border-teal-200',
                                dot: 'bg-teal-400',
                            },
                            {
                                bg: 'bg-fuchsia-50',
                                text: 'text-fuchsia-800',
                                border: 'border-fuchsia-200',
                                dot: 'bg-fuchsia-400',
                            },
                        ],
                        enterprise: [
                            {
                                bg: 'bg-cyan-50',
                                text: 'text-cyan-800',
                                border: 'border-cyan-200',
                                dot: 'bg-cyan-400',
                            },
                            {
                                bg: 'bg-lime-50',
                                text: 'text-lime-800',
                                border: 'border-lime-200',
                                dot: 'bg-lime-400',
                            },
                            {
                                bg: 'bg-orange-50',
                                text: 'text-orange-800',
                                border: 'border-orange-200',
                                dot: 'bg-orange-400',
                            },
                            {
                                bg: 'bg-purple-50',
                                text: 'text-purple-800',
                                border: 'border-purple-200',
                                dot: 'bg-purple-400',
                            },
                        ],
                        template: [
                            {
                                bg: 'bg-slate-50',
                                text: 'text-slate-800',
                                border: 'border-slate-200',
                                dot: 'bg-slate-400',
                            },
                            {
                                bg: 'bg-blue-50',
                                text: 'text-blue-800',
                                border: 'border-blue-200',
                                dot: 'bg-blue-400',
                            },
                            {
                                bg: 'bg-emerald-50',
                                text: 'text-emerald-800',
                                border: 'border-emerald-200',
                                dot: 'bg-emerald-400',
                            },
                            {
                                bg: 'bg-amber-50',
                                text: 'text-amber-800',
                                border: 'border-amber-200',
                                dot: 'bg-amber-400',
                            },
                        ],
                    };
                    const palette = palettes[type];
                    const tone = palette[hash % palette.length];
                    return (
                        <motion.span
                            initial={{scale: 0.95, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            whileHover={{
                                y: -1,
                                boxShadow: '0 1px 6px rgba(15,23,42,0.15)',
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 480,
                                damping: 30,
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-[2px] text-[10px] leading-[12px] border max-w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis ${tone.bg} ${tone.text} ${tone.border}`}
                            title={current || value || ''}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${tone.dot}`}
                            ></span>
                            <span className='truncate'>{current || value}</span>
                            <button
                                onClick={() => {
                                    setCurrent(undefined);
                                    onChange(undefined);
                                }}
                                className='ml-1 hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity'
                                aria-label='Clear'
                            >
                                <X className='h-3 w-3' />
                            </button>
                        </motion.span>
                    );
                })()
            ) : (
                <button
                    onClick={() => setOpen((s) => !s)}
                    className={`w-full text-left px-2 ${sizeClass} rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-500`}
                >
                    {placeholder || 'Select'}
                </button>
            )}
            {/* plus button removed per request */}
            {open &&
                dropdownPos &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className='z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl'
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                        }}
                    >
                        <div className='absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200'></div>
                        <div className='p-2 border-b border-slate-200'>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Search ${type}s`}
                                className='w-full rounded border border-slate-300 px-2 py-1 text-[12px]'
                            />
                        </div>
                        <div className='max-h-60 overflow-auto text-[12px] px-3 py-2 space-y-2'>
                            {loading ? (
                                <div className='px-3 py-2 text-slate-500'>
                                    Loading…
                                </div>
                            ) : options.length === 0 ? (
                                <div className='px-3 py-2 text-slate-500'>
                                    No matches
                                </div>
                            ) : (
                                options
                                    .filter((opt) =>
                                        query
                                            ? opt.name
                                                  .toLowerCase()
                                                  .includes(query.toLowerCase())
                                            : true,
                                    )
                                    .map((opt, idx) => {
                                        const palette = [
                                            {
                                                bg: 'bg-pink-500',
                                                hover: 'hover:bg-pink-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-sky-500',
                                                hover: 'hover:bg-sky-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-slate-400',
                                                hover: 'hover:bg-slate-300',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-emerald-500',
                                                hover: 'hover:bg-emerald-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-violet-500',
                                                hover: 'hover:bg-violet-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-amber-500',
                                                hover: 'hover:bg-amber-400',
                                                text: 'text-white',
                                            },
                                        ];
                                        const tone =
                                            palette[idx % palette.length];
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setCurrent(opt.name);
                                                    onChange(opt.name);
                                                    setOpen(false);
                                                }}
                                                className={`w-full rounded-md px-4 py-2 ${tone.bg} ${tone.hover} ${tone.text} transition-colors`}
                                            >
                                                {opt.name}
                                            </button>
                                        );
                                    })
                            )}
                        </div>
                        <div className='border-t border-slate-200 px-3 py-2'>
                            <button
                                onClick={() => {
                                    setAdding('');
                                    setShowAdder(true);
                                }}
                                className='group w-full text-left text-[12px] text-slate-700 hover:text-slate-900 flex items-center gap-2'
                            >
                                <Plus className='h-3.5 w-3.5' />
                                <span className='inline-block max-w-0 overflow-hidden whitespace-nowrap -translate-x-1 opacity-0 group-hover:max-w-xs group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200'>
                                    Add new {type}
                                </span>
                            </button>
                            {showAdder && (
                                <div className='mt-2 overflow-hidden'>
                                    <div className='flex items-center gap-2'>
                                        <motion.input
                                            initial={{x: -12, opacity: 0}}
                                            animate={{x: 0, opacity: 1}}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 420,
                                                damping: 28,
                                            }}
                                            value={adding}
                                            onChange={(e) =>
                                                setAdding(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') addNew();
                                                if (e.key === 'Escape')
                                                    setShowAdder(false);
                                            }}
                                            placeholder={`Enter ${type} name`}
                                            className='flex-1 rounded border border-slate-300 px-2 py-1 text-[12px]'
                                        />
                                        <button
                                            onClick={async () => {
                                                await addNew();
                                            }}
                                            className='inline-flex items-center gap-1 px-2 py-1 rounded bg-violet-600 text-white text-[12px] hover:bg-violet-700'
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
            {/* removed old portal-based adder */}
        </div>
    );
}

interface AccountsTableProps {
    rows: AccountRow[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    title?: string;
    groupByExternal?: 'none' | 'enterpriseName' | 'productName' | 'serviceName';
    onGroupByChange?: (
        g: 'none' | 'enterpriseName' | 'productName' | 'serviceName',
    ) => void;
    hideControls?: boolean;
    visibleColumns?: Array<
        | 'contact'
        | 'accountName'
        | 'country'
        | 'addressLine1'
        | 'addressLine2'
        | 'city'
        | 'state'
        | 'pincode'
        | 'actions'
    >;
    highlightQuery?: string;
    onQuickAddRow?: () => void;
}

function SortableAccountRow({
    row,
    index,
    onEdit,
    onDelete,
    cols,
    gridTemplate,
    highlightQuery,
    onQuickAddRow,
    customColumns = [],
    isExpanded,
    onToggle,
    expandedContent,
    onUpdateField,
    isSelected,
    onSelect,
    onStartFill,
    inFillRange,
    pinFirst,
    firstColWidth,
}: {
    row: AccountRow;
    index: number;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    cols: string[];
    gridTemplate: string;
    highlightQuery?: string;
    onQuickAddRow?: () => void;
    customColumns?: string[];
    isExpanded: boolean;
    onToggle: (id: string) => void;
    expandedContent?: React.ReactNode;
    onUpdateField: (rowId: string, key: keyof AccountRow, value: any) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onStartFill: (rowId: string, col: keyof AccountRow, value: string) => void;
    inFillRange: boolean;
    pinFirst?: boolean;
    firstColWidth?: string;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuUp, setMenuUp] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);
    const [menuPos, setMenuPos] = useState<{top: number; left: number} | null>(
        null,
    );
    const [isDragging, setIsDragging] = useState(false);

    const toggleMenu = () => {
        const rect = actionsRef.current?.getBoundingClientRect();
        if (rect) {
            const spaceBelow = window.innerHeight - rect.bottom;
            setMenuUp(spaceBelow < 160);
            const dropdownHeight = 120;
            const width = 112; // w-28
            const top =
                spaceBelow < 160
                    ? rect.top - 8 - dropdownHeight
                    : rect.bottom + 8;
            const left = Math.max(8, rect.right - width);
            setMenuPos({top, left});
        }
        setMenuOpen((s) => !s);
    };
    const highlightText = (text: string) => {
        const q = (highlightQuery || '').trim();
        if (!q) return <>{text}</>;
        try {
            const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`(${esc})`, 'ig');
            const parts = text.split(re);
            return (
                <>
                    {parts.map((part, i) =>
                        re.test(part) ? (
                            <mark
                                key={i}
                                className='bg-yellow-200 px-0.5 rounded'
                            >
                                {part}
                            </mark>
                        ) : (
                            <span key={i}>{part}</span>
                        ),
                    )}
                </>
            );
        } catch {
            return <>{text}</>;
        }
    };
    const Chip = ({
        text,
        tone,
    }: {
        text: string;
        tone: 'slate' | 'sky' | 'violet' | 'emerald' | 'amber';
    }) => {
        const toneMap: Record<
            string,
            {bg: string; text: string; border: string; dot: string}
        > = {
            sky: {
                bg: 'bg-sky-50',
                text: 'text-sky-800',
                border: 'border-sky-200',
                dot: 'bg-sky-400',
            },
            slate: {
                bg: 'bg-slate-100',
                text: 'text-slate-800',
                border: 'border-slate-200',
                dot: 'bg-slate-400',
            },
            violet: {
                bg: 'bg-violet-50',
                text: 'text-violet-800',
                border: 'border-violet-200',
                dot: 'bg-violet-400',
            },
            emerald: {
                bg: 'bg-emerald-50',
                text: 'text-emerald-800',
                border: 'border-emerald-200',
                dot: 'bg-emerald-400',
            },
            amber: {
                bg: 'bg-amber-50',
                text: 'text-amber-800',
                border: 'border-amber-200',
                dot: 'bg-amber-400',
            },
        };
        const t = toneMap[tone] || toneMap.slate;
        return (
            <motion.span
                initial={{scale: 0.95, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                whileHover={{y: -1, boxShadow: '0 1px 6px rgba(15,23,42,0.15)'}}
                transition={{type: 'spring', stiffness: 480, damping: 30}}
                className={`inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full text-[10px] leading-[12px] border max-w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis ${t.bg} ${t.text} ${t.border}`}
                title={text}
            >
                <span
                    className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${t.dot}`}
                ></span>
                <span className='truncate'>{text}</span>
            </motion.span>
        );
    };

    const cssTemplate = gridTemplate.split('_').join(' ');
    return (
        <Reorder.Item
            value={row.id}
            id={row.id}
            data-account-id={row.id}
            layout
            draggable
            onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
                try {
                    e.dataTransfer.effectAllowed = 'move';
                    const rowEl = (e.currentTarget as HTMLElement).closest(
                        '[data-account-id]',
                    ) as HTMLElement | null;
                    if (rowEl) {
                        const rect = rowEl.getBoundingClientRect();
                        const proxy = rowEl.cloneNode(true) as HTMLElement;
                        proxy.style.position = 'fixed';
                        proxy.style.top = `${rect.top}px`;
                        proxy.style.left = `${rect.left}px`;
                        proxy.style.width = `${rect.width}px`;
                        proxy.style.maxWidth = `${rect.width}px`;
                        proxy.style.pointerEvents = 'none';
                        proxy.style.background = 'white';
                        proxy.style.border = '1px solid rgba(148,163,184,0.6)';
                        proxy.style.boxShadow =
                            '0 16px 40px rgba(15,23,42,0.2)';
                        proxy.style.borderRadius = '8px';
                        proxy.style.zIndex = '9999';
                        document.body.appendChild(proxy);
                        e.dataTransfer.setDragImage(proxy, 12, 12);
                        const cleanup = () => {
                            try {
                                document.body.removeChild(proxy);
                            } catch {}
                            window.removeEventListener('dragend', cleanup);
                        };
                        window.addEventListener('dragend', cleanup, {
                            once: true,
                        });
                    }
                    e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({rowId: String(row.id)}),
                    );
                } catch {}
            }}
            onDragOverCapture={(e: React.DragEvent<HTMLDivElement>) => {
                // Keep HTML5 DnD active so the outer trash target accepts the drop
                e.preventDefault();
            }}
            initial={
                String(row.id || '').startsWith('tmp-')
                    ? {opacity: 0, y: -6, scale: 0.98}
                    : false
            }
            animate={{opacity: 1, y: 0, scale: 1}}
            transition={{
                layout: {duration: 0.22, ease: [0.22, 1, 0.36, 1]},
                type: 'spring',
                stiffness: 460,
                damping: 30,
                mass: 0.6,
            }}
            className={`w-full grid items-center gap-0 rounded-md overflow-visible border border-slate-200 transition-all duration-200 ease-in-out transform-gpu h-10 ${
                isDragging
                    ? 'cursor-grabbing ring-2 ring-primary-300/40 bg-white shadow-xl'
                    : 'cursor-grab hover:bg-slate-50 hover:shadow-sm hover:ring-1 hover:ring-slate-200'
            } ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} ${
                isSelected ? 'ring-2 ring-primary-300/60 bg-primary-50/60' : ''
            } ${inFillRange ? 'bg-primary-50/40' : ''} ${
                isExpanded ? 'bg-primary-50 border-l-4 border-l-primary-400' : ''
            }`}
            style={{
                gridTemplateColumns: cssTemplate,
                willChange: 'transform',
                zIndex: isDragging ? 20 : 'auto',
            }}
            onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                onSelect(row.id);
                // If pointerdown starts on non-draggable interactive elements, don't begin HTML5 drag
                const target = e.target as HTMLElement;
                if (
                    target.closest(
                        'input,textarea,select,button,[contenteditable="true"]',
                    )
                ) {
                    (e.currentTarget as HTMLElement).draggable = false;
                } else {
                    (e.currentTarget as HTMLElement).draggable = true;
                }
            }}
        >
            {cols.includes('contact') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 ${
                        pinFirst
                            ? 'sticky left-0 z-10 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)]'
                            : ''
                    } ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    } border-l-4 ${
                        isSelected ? 'border-l-sky-400' : 'border-l-slate-200'
                    }`}
                    style={{
                        width: firstColWidth,
                        minWidth: firstColWidth,
                        maxWidth: firstColWidth,
                    }}
                >
                    {/* Drag handle for HTML5 DnD to toolbar trash */}
                    <span
                        className='mr-1 inline-flex h-5 w-3 items-center justify-center cursor-grab active:cursor-grabbing select-none text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150'
                        title='Drag row to trash'
                        draggable
                        onMouseDown={(e: React.MouseEvent) => {
                            // Prevent framer-motion row drag from hijacking
                            e.stopPropagation();
                        }}
                        onDragStart={(e: React.DragEvent<HTMLSpanElement>) => {
                            try {
                                e.dataTransfer.effectAllowed = 'move';
                                // Visible floating proxy so the row appears above headers while dragging
                                const rowEl = (
                                    e.currentTarget as HTMLElement
                                ).closest(
                                    '[data-account-id]',
                                ) as HTMLElement | null;
                                if (rowEl) {
                                    const rect = rowEl.getBoundingClientRect();
                                    const proxy = rowEl.cloneNode(
                                        true,
                                    ) as HTMLElement;
                                    proxy.style.position = 'fixed';
                                    proxy.style.top = `${rect.top}px`;
                                    proxy.style.left = `${rect.left}px`;
                                    proxy.style.width = `${rect.width}px`;
                                    proxy.style.maxWidth = `${rect.width}px`;
                                    proxy.style.pointerEvents = 'none';
                                    proxy.style.background = 'white';
                                    proxy.style.border =
                                        '1px solid rgba(148,163,184,0.6)';
                                    proxy.style.boxShadow =
                                        '0 16px 40px rgba(15,23,42,0.2)';
                                    proxy.style.borderRadius = '8px';
                                    proxy.style.zIndex = '9999';
                                    document.body.appendChild(proxy);
                                    e.dataTransfer.setDragImage(proxy, 12, 12);
                                    // Cleanup when drag ends
                                    const cleanup = () => {
                                        try {
                                            document.body.removeChild(proxy);
                                        } catch {}
                                        window.removeEventListener(
                                            'dragend',
                                            cleanup,
                                        );
                                    };
                                    window.addEventListener(
                                        'dragend',
                                        cleanup,
                                        {once: true},
                                    );
                                }
                                e.dataTransfer.setData(
                                    'application/json',
                                    JSON.stringify({rowId: String(row.id)}),
                                );
                            } catch {}
                        }}
                    >
                        <svg viewBox='0 0 8 16' className='h-3 w-2 opacity-70'>
                            <circle cx='2' cy='2' r='1' fill='currentColor' />
                            <circle cx='6' cy='2' r='1' fill='currentColor' />
                            <circle cx='2' cy='6' r='1' fill='currentColor' />
                            <circle cx='6' cy='6' r='1' fill='currentColor' />
                            <circle cx='2' cy='10' r='1' fill='currentColor' />
                            <circle cx='6' cy='10' r='1' fill='currentColor' />
                            <circle cx='2' cy='14' r='1' fill='currentColor' />
                            <circle cx='6' cy='14' r='1' fill='currentColor' />
                        </svg>
                    </span>
                    <button
                        className={`h-5 w-5 rounded text-slate-600 hover:bg-slate-100 ${
                            isExpanded ? '' : ''
                        }`}
                        onClick={() => onToggle(row.id)}
                        title='Toggle subitems'
                    >
                        <motion.span
                            initial={false}
                            animate={{rotate: isExpanded ? 90 : 0}}
                            transition={{
                                type: 'spring',
                                stiffness: 520,
                                damping: 30,
                            }}
                            className='inline-flex'
                        >
                            <ChevronRight
                                className={`h-4 w-4 transition-all duration-150 ${
                                    isExpanded
                                        ? 'opacity-100 text-sky-600'
                                        : 'opacity-0 group-hover:opacity-100'
                                }`}
                            />
                        </motion.span>
                    </button>
                    <div className='font-medium text-slate-900 text-[12px] min-w-0 truncate'>
                        <InlineEditableText
                            value={(row as any).globalClientName || ''}
                            onCommit={(v) => {
                                onUpdateField(
                                    row.id,
                                    'globalClientName' as any,
                                    v,
                                );
                            }}
                            className='text-[12px]'
                            placeholder='Enter Client Name'
                        />
                    </div>
                </div>
            )}
            {cols.includes('accountName') && (
                <div className='text-slate-700 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={row.accountName}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'accountName', v)
                        }
                        className='text-[12px]'
                        dataAttr={`account-${row.id}`}
                        placeholder='Enter account name'
                    />
                </div>
            )}
            {cols.includes('email') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={row.email}
                        onCommit={(v) => onUpdateField(row.id, 'email', v)}
                        className='text-[12px]'
                        placeholder='email@company.com'
                    />
                </div>
            )}
            {cols.includes('phone') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={row.phone}
                        onCommit={(v) => onUpdateField(row.id, 'phone', v)}
                        className='text-[12px]'
                        placeholder='Phone number'
                    />
                </div>
            )}
            {cols.includes('country') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={(row as any).address?.country || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                country: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='Country'
                    />
                </div>
            )}
            {cols.includes('addressLine1') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={(row as any).address?.addressLine1 || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                addressLine1: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='Address Line 1'
                    />
                </div>
            )}
            {cols.includes('addressLine2') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={(row as any).address?.addressLine2 || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                addressLine2: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='Address Line 2'
                    />
                </div>
            )}
            {cols.includes('city') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={(row as any).address?.city || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                city: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='City'
                    />
                </div>
            )}
            {cols.includes('state') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={(row as any).address?.state || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                state: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='State'
                    />
                </div>
            )}
            {cols.includes('pincode') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={(row as any).address?.pincode || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                pincode: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='PIN/ZIP'
                    />
                </div>
            )}
            {cols.includes('enterpriseName') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <AsyncChipSelect
                        type='enterprise'
                        value={row.enterpriseName}
                        onChange={(v) =>
                            onUpdateField(row.id, 'enterpriseName', v || '')
                        }
                        placeholder='Select enterprise'
                        compact
                    />
                </div>
            )}
            {cols.includes('productName') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <AsyncChipSelect
                        type='product'
                        value={row.productName}
                        onChange={(v) =>
                            onUpdateField(row.id, 'productName', v || '')
                        }
                        placeholder='Select product'
                        compact
                    />
                </div>
            )}
            {cols.includes('serviceName') && (
                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <AsyncChipSelect
                        type='service'
                        value={row.serviceName}
                        onChange={(v) =>
                            onUpdateField(row.id, 'serviceName', v || '')
                        }
                        placeholder='Select service'
                        compact
                    />
                </div>
            )}
            {cols.includes('status') && (
                <div className='relative border-r border-slate-200 px-0 py-0'>
                    <div
                        id={`status-${row.id}`}
                        className={`group relative w-full h-full min-h-[32px] flex items-center justify-center px-3 cursor-pointer select-none rounded-md overflow-hidden shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] transition-colors ${
                            row.status === 'active'
                                ? 'bg-emerald-500'
                                : row.status === 'inactive'
                                ? 'bg-rose-500'
                                : 'bg-slate-200'
                        }`}
                        style={{perspective: '600px'}}
                        onClick={(e) => {
                            const rect = (
                                e.currentTarget as HTMLDivElement
                            ).getBoundingClientRect();
                            const menu = document.createElement('div');
                            menu.style.position = 'fixed';
                            menu.style.top = `${rect.bottom + 6}px`;
                            menu.style.left = `${rect.left}px`;
                            menu.style.zIndex = '9999';
                            menu.style.minWidth = `${rect.width}px`;
                            menu.className =
                                'origin-top rounded-lg border border-slate-200 bg-white shadow-xl text-[12px] transition transform duration-150 ease-out';
                            menu.style.transform = 'scale(0.96)';
                            menu.style.opacity = '0';
                            menu.innerHTML = `
                                <div class="py-1">
                                    <button data-val="active" class="flex items-center gap-2 w-full px-3 py-2 text-left rounded-md text-emerald-700 hover:bg-emerald-50">
                                        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Active
                                    </button>
                                    <button data-val="inactive" class="flex items-center gap-2 w-full px-3 py-2 text-left rounded-md text-rose-700 hover:bg-rose-50">
                                        <span class="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                                        Inactive
                                    </button>
                                </div>
                            `;
                            const handler = (ev: any) => {
                                const btn =
                                    ev.target?.closest?.('button[data-val]');
                                const val = btn?.getAttribute?.('data-val');
                                if (val) {
                                    onUpdateField(
                                        row.id,
                                        'status',
                                        val as 'active' | 'inactive',
                                    );
                                    document.body.removeChild(menu);
                                    document.removeEventListener(
                                        'click',
                                        outside,
                                    );
                                }
                            };
                            const outside = (ev: any) => {
                                if (!menu.contains(ev.target)) {
                                    document.body.removeChild(menu);
                                    document.removeEventListener(
                                        'click',
                                        outside,
                                    );
                                }
                            };
                            menu.addEventListener('click', handler);
                            document.body.appendChild(menu);
                            setTimeout(
                                () =>
                                    document.addEventListener('click', outside),
                                0,
                            );
                            requestAnimationFrame(() => {
                                menu.style.transform = 'scale(1)';
                                menu.style.opacity = '1';
                            });
                        }}
                    >
                        <span
                            className={`font-semibold text-[12px] tracking-wide capitalize ${
                                row.status ? 'text-white' : 'text-slate-700'
                            }`}
                        >
                            {row.status
                                ? row.status === 'active'
                                    ? 'Active'
                                    : 'Inactive'
                                : 'Set status'}
                        </span>
                    </div>
                </div>
            )}
            {/* actions column removed */}
            {/* trailing add row removed; fill handle removed */}
            {isExpanded && expandedContent && (
                <motion.div
                    className='col-span-full'
                    initial={{opacity: 0, y: -4}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.18, ease: [0.22, 1, 0.36, 1]}}
                >
                    {expandedContent}
                </motion.div>
            )}
        </Reorder.Item>
    );
}

export default function AccountsTable({
    rows,
    onEdit,
    onDelete,
    title,
    groupByExternal,
    onGroupByChange,
    hideControls,
    visibleColumns,
    highlightQuery,
    onQuickAddRow,
}: AccountsTableProps) {
    // Keep a local order for drag-and-drop. Sync when rows change
    const [order, setOrder] = useState<string[]>(() => rows.map((r) => r.id));
    const [localRows, setLocalRows] = useState<AccountRow[]>(rows);
    useEffect(() => {
        // Preserve existing order; append any new ids
        const existing = new Set(order);
        const merged = [
            ...order.filter((id) => rows.some((r) => r.id === id)),
            ...rows.filter((r) => !existing.has(r.id)).map((r) => r.id),
        ];
        setOrder(merged);
        // Deep copy licenses so new references are created
        const cloned = rows.map((r) => ({
            ...r,
            licenses: (r as any).licenses
                ? (r as any).licenses.map((l: any) => ({...l}))
                : [],
        })) as AccountRow[];
        setLocalRows(cloned);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows.map((r) => r.id).join(',')]);

    const orderedItems = useMemo(
        () =>
            order
                .map((id) => localRows.find((r) => r.id === id))
                .filter(Boolean) as AccountRow[],
        [order, localRows],
    );

    // Persist helpers
    // Debounced autosave per-row to avoid excessive API traffic
    const saveTimersRef = useRef<Record<string, any>>({});
    const latestRowRef = useRef<Record<string, AccountRow>>({});
    function schedulePersist(row: AccountRow, delay = 600) {
        const rowId = String(row.id);
        latestRowRef.current[rowId] = row;
        if (saveTimersRef.current[rowId])
            clearTimeout(saveTimersRef.current[rowId]);
        saveTimersRef.current[rowId] = setTimeout(() => {
            const latest = latestRowRef.current[rowId];
            if (latest) void persistAccountRow(latest);
        }, delay);
    }
    useEffect(() => {
        return () => {
            // cleanup pending timers on unmount without forcing save
            Object.values(saveTimersRef.current).forEach((t) =>
                clearTimeout(t),
            );
        };
    }, []);
    async function persistAccountRow(row: AccountRow) {
        try {
            const core = {
                accountName: row.accountName,
                email: row.email,
                phone: row.phone,
            } as any;
            // Map UI state into backend details JSON expected by server
            const addr = (row as any).address || {};
            const tech = (row as any).technical || {};
            const licenses = (((row as any).licenses as any[]) || []).map(
                (lic) => ({
                    enterprise: lic.enterprise || null,
                    product: lic.product || null,
                    service: lic.service || null,
                    category: lic.service || null,
                    licenseDate: lic.licenseStart || null,
                    expirationDate: lic.licenseEnd || null,
                    users:
                        typeof lic.users === 'number'
                            ? lic.users
                            : lic.users
                            ? parseInt(String(lic.users), 10)
                            : 0,
                    renewalNotice:
                        typeof lic.renewalNotice === 'boolean'
                            ? lic.renewalNotice
                            : !!lic.renewalNotice,
                    renewalNoticePeriod:
                        typeof lic.noticeDays === 'number'
                            ? lic.noticeDays
                            : lic.noticeDays
                            ? parseInt(String(lic.noticeDays), 10)
                            : null,
                    contacts: Array.isArray(lic.contacts)
                        ? lic.contacts.map((c: any) => ({
                              contact: c.contact || '',
                              title: c.title || '',
                              email: c.email || '',
                              phone: c.phone || '',
                          }))
                        : [],
                }),
            );
            const details = {
                firstName: row.firstName,
                lastName: row.lastName,
                globalClientName: (row as any).globalClientName || '',
                status: row.status,
                enterpriseName: row.enterpriseName,
                productName: row.productName,
                serviceName: row.serviceName,
                // Address fields are expected at the top-level of details
                addressLine1: addr.addressLine1 || '',
                addressLine2: addr.addressLine2 || '',
                country: addr.country || '',
                state: addr.state || '',
                city: addr.city || '',
                pincode: addr.pincode || '',
                // Technical user is expected as technicalUserDetails or technicalUsername
                technicalUserDetails: {
                    username: tech.username || '',
                    email: tech.email || '',
                    firstName: tech.firstName || '',
                },
                technicalUsername: tech.username || '',
                // Licenses are expected in details.services
                services: licenses,
            } as any;
            if (String(row.id || '').startsWith('tmp-')) {
                if (!row.accountName || !row.accountName.trim()) return; // wait until valid
                const created = await api.post<AccountRow>('/api/accounts', {
                    ...core,
                    ...details,
                });
                // Replace temp id with real id
                setLocalRows((prev) =>
                    prev.map((r) =>
                        String(r.id) === String(row.id)
                            ? ({...r, id: created.id} as AccountRow)
                            : r,
                    ),
                );
                setOrder((prev) =>
                    prev.map((id) =>
                        String(id) === String(row.id)
                            ? (created.id as string)
                            : id,
                    ),
                );
                // Related tables are handled server-side from details
            } else {
                await api.put<AccountRow>('/api/accounts', {
                    id: row.id,
                    ...core,
                    ...details,
                });
                // Related tables handled server-side from details
            }
        } catch (_e) {
            // TODO: surface toast; keep silent here to avoid blocking UI
        }
    }

    function updateRowField(rowId: string, key: keyof AccountRow, value: any) {
        let changed: AccountRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const next = {...r, [key]: value} as AccountRow;
                changed = next;
                return next;
            }),
        );
        if (changed) schedulePersist(changed);
    }

    function updateRowNested(
        rowId: string,
        path: ['address' | 'technical', string],
        value: any,
    ) {
        let changed: AccountRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const [root, field] = path;
                let next: AccountRow;
                if (root === 'address') {
                    next = {
                        ...r,
                        address: {
                            ...((r as any).address || {}),
                            [field]: value,
                        },
                    } as AccountRow;
                } else {
                    next = {
                        ...r,
                        technical: {
                            ...((r as any).technical || {}),
                            [field]: value,
                        },
                    } as AccountRow;
                }
                changed = next;
                return next;
            }),
        );
        if (changed) schedulePersist(changed);
    }

    function updateLicenseField(
        rowId: string,
        index: number,
        key:
            | 'enterprise'
            | 'product'
            | 'service'
            | 'licenseStart'
            | 'licenseEnd'
            | 'users'
            | 'renewalNotice'
            | 'noticeDays',
        value: any,
    ) {
        let changed: AccountRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const list = [...(((r as any).licenses as any[]) || [])];
                const curr = {...(list[index] || {})} as any;
                curr[key] = value;
                list[index] = curr;
                const next = {...r, licenses: list} as AccountRow;
                changed = next;
                return next;
            }),
        );
        if (changed) schedulePersist(changed);
    }
    // removed license contact chevron state
    function updateLicenseContactField(
        rowId: string,
        licIndex: number,
        contactIndex: number,
        key: 'contact' | 'title' | 'email' | 'phone',
        value: any,
    ) {
        let changed: AccountRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const licenses = [...(((r as any).licenses as any[]) || [])];
                const lic = {...(licenses[licIndex] || {})} as any;
                const contacts = [...((lic.contacts as any[]) || [])];
                const curr = {...(contacts[contactIndex] || {})};
                (curr as any)[key] = value;
                contacts[contactIndex] = curr;
                lic.contacts = contacts;
                licenses[licIndex] = lic;
                const next = {...r, licenses} as AccountRow;
                changed = next;
                return next;
            }),
        );
        if (changed) schedulePersist(changed);
    }
    function addLicenseContactRow(rowId: string, licIndex: number) {
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const licenses = [...(((r as any).licenses as any[]) || [])];
                const lic = {...(licenses[licIndex] || {})} as any;
                const contacts = [...((lic.contacts as any[]) || [])];
                contacts.push({contact: '', title: '', email: '', phone: ''});
                lic.contacts = contacts;
                licenses[licIndex] = lic;
                return {...r, licenses} as AccountRow;
            }),
        );
    }
    const [groupBy, setGroupBy] = useState<
        'none' | 'enterpriseName' | 'productName' | 'serviceName'
    >('none');
    // sync external groupBy
    React.useEffect(() => {
        if (groupByExternal) setGroupBy(groupByExternal);
    }, [groupByExternal]);

    const columnOrder: AccountsTableProps['visibleColumns'] = useMemo(
        () => [
            // Parent table columns per request
            'contact',
            'accountName',
            'country',
            'addressLine1',
            'addressLine2',
            'city',
            'state',
            'pincode',
        ],
        [],
    );
    const cols = useMemo(() => {
        const base = (columnOrder || []) as string[];
        if (!visibleColumns || visibleColumns.length === 0) return base;
        const allowed = new Set(visibleColumns as string[]);
        // Keep canonical order from columnOrder; filter by visibility
        return base.filter((c) => allowed.has(c));
    }, [visibleColumns, columnOrder]);

    const colSizes: Record<string, string> = {
        contact: '140px',
        accountName: 'minmax(120px,1.1fr)',
        country: 'minmax(110px,0.9fr)',
        addressLine1: 'minmax(160px,1.2fr)',
        addressLine2: 'minmax(160px,1.1fr)',
        city: 'minmax(100px,0.9fr)',
        state: 'minmax(100px,0.9fr)',
        pincode: 'minmax(100px,0.8fr)',
    };
    const [customColumns, setCustomColumns] = useState<string[]>([]);
    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [subItems, setSubItems] = useState<Record<string, string[]>>({});
    const [sectionOpen, setSectionOpen] = useState<
        Record<string, {address: boolean; technical: boolean; license: boolean}>
    >({});
    const [pinFirst, setPinFirst] = useState(true);
    const firstColWidth = '140px'; // enforce fixed width for first column
    const gridTemplate = useMemo(() => {
        const base = cols.map((c) => colSizes[c]).join('_');
        const custom = customColumns.map(() => 'minmax(110px,1fr)').join('_');
        return [base, custom].filter(Boolean).join('_');
    }, [cols, customColumns, colWidths]);

    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [contactModal, setContactModal] = useState<{
        open: boolean;
        rowId: string | null;
        licIndex: number | null;
    }>({open: false, rowId: null, licIndex: null});
    const [contactDrafts, setContactDrafts] = useState<
        Array<{contact: string; title: string; email: string; phone: string}>
    >([{contact: '', title: '', email: '', phone: ''}]);

    useEffect(() => {
        const handler = (e: any) => {
            const d = e?.detail || {};
            setContactDrafts([{contact: '', title: '', email: '', phone: ''}]);
            setContactModal({
                open: true,
                rowId: d.rowId || null,
                licIndex: d.licIndex ?? null,
            });
        };
        document.addEventListener('contact-modal-open', handler as any);
        return () =>
            document.removeEventListener('contact-modal-open', handler as any);
    }, []);

    const contactModalPortal = React.useMemo(() => {
        if (!contactModal.open) return null;
        const onClose = () =>
            setContactModal({open: false, rowId: null, licIndex: null});
        const onAddRow = () =>
            setContactDrafts((v) => [
                ...v,
                {contact: '', title: '', email: '', phone: ''},
            ]);
        const onRemoveRow = (idx: number) =>
            setContactDrafts((v) => v.filter((_, i) => i !== idx));
        const emailOk = (e: string) => !e || /.+@.+\..+/.test(String(e).trim());
        const phoneOk = (p: string) =>
            !p || /[0-9()+\-\s]{6,}/.test(String(p).trim());
        const nonEmpty = (d: {
            contact: string;
            title: string;
            email: string;
            phone: string;
        }) => (d.contact || d.title || d.email || d.phone).trim?.() !== '';
        const validDrafts = contactDrafts
            .filter(nonEmpty)
            .filter((d) => emailOk(d.email) && phoneOk(d.phone));
        const canSave = validDrafts.length > 0;
        const onSave = () => {
            if (!contactModal.rowId || contactModal.licIndex == null)
                return onClose();
            const rowId = contactModal.rowId;
            const licIndex = contactModal.licIndex;
            // append each draft as a new contact then persist via existing helpers
            let baseCount = 0;
            const row = localRows.find((r) => r.id === rowId) as any;
            if (row && Array.isArray(row.licenses) && row.licenses[licIndex]) {
                baseCount = (row.licenses[licIndex].contacts || []).length;
            }
            validDrafts.forEach((d, idx) => {
                addLicenseContactRow(rowId, licIndex);
                const ci = baseCount + idx;
                updateLicenseContactField(
                    rowId,
                    licIndex,
                    ci,
                    'contact',
                    d.contact || '',
                );
                updateLicenseContactField(
                    rowId,
                    licIndex,
                    ci,
                    'title',
                    d.title || '',
                );
                updateLicenseContactField(
                    rowId,
                    licIndex,
                    ci,
                    'email',
                    d.email || '',
                );
                updateLicenseContactField(
                    rowId,
                    licIndex,
                    ci,
                    'phone',
                    d.phone || '',
                );
            });
            onClose();
        };
        return createPortal(
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
                <div className='bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden'>
                    <div className='px-4 py-3 border-b border-slate-200 flex items-center justify-between'>
                        <div className='text-[14px] font-semibold text-slate-800'>
                            Contact details
                        </div>
                        <button
                            className='p-1 rounded hover:bg-slate-100'
                            onClick={onClose}
                        >
                            <X className='w-4 h-4' />
                        </button>
                    </div>
                    <div className='p-4 space-y-3'>
                        <div className='max-h-[52vh] overflow-y-auto pr-1 space-y-2'>
                            <AnimatePresence initial={false}>
                                {contactDrafts.map((d, idx) => {
                                    const emailValid = emailOk(d.email);
                                    const phoneValid = phoneOk(d.phone);
                                    return (
                                        <motion.div
                                            key={`ct-${idx}`}
                                            initial={{
                                                opacity: 0,
                                                y: 6,
                                                scale: 0.98,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -6,
                                                scale: 0.98,
                                            }}
                                            className='rounded-md border border-slate-200 bg-slate-50/40 px-3 py-2'
                                        >
                                            <div className='grid grid-cols-2 gap-2'>
                                                <input
                                                    className='border border-slate-300 rounded px-2 py-1 text-[12px]'
                                                    placeholder='Contact name'
                                                    value={d.contact}
                                                    onChange={(e) =>
                                                        setContactDrafts((v) =>
                                                            v.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          contact:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : x,
                                                            ),
                                                        )
                                                    }
                                                />
                                                <input
                                                    className='border border-slate-300 rounded px-2 py-1 text-[12px]'
                                                    placeholder='Title'
                                                    value={d.title}
                                                    onChange={(e) =>
                                                        setContactDrafts((v) =>
                                                            v.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          title: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : x,
                                                            ),
                                                        )
                                                    }
                                                />
                                                <input
                                                    className={`border rounded px-2 py-1 text-[12px] ${
                                                        emailValid
                                                            ? 'border-slate-300'
                                                            : 'border-rose-400 bg-rose-50/30'
                                                    }`}
                                                    placeholder='Email'
                                                    value={d.email}
                                                    onChange={(e) =>
                                                        setContactDrafts((v) =>
                                                            v.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          email: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : x,
                                                            ),
                                                        )
                                                    }
                                                />
                                                <input
                                                    className={`border rounded px-2 py-1 text-[12px] ${
                                                        phoneValid
                                                            ? 'border-slate-300'
                                                            : 'border-rose-400 bg-rose-50/30'
                                                    }`}
                                                    placeholder='Phone'
                                                    value={d.phone}
                                                    onChange={(e) =>
                                                        setContactDrafts((v) =>
                                                            v.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          phone: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : x,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className='flex justify-end pt-2'>
                                                {contactDrafts.length > 1 && (
                                                    <button
                                                        className='text-[11px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-100'
                                                        onClick={() =>
                                                            onRemoveRow(idx)
                                                        }
                                                        title='Remove contact'
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        <div className='flex justify-between items-center'>
                            <button
                                className='text-[12px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-50'
                                onClick={onAddRow}
                            >
                                Add another
                            </button>
                            <div className='space-x-2'>
                                <button
                                    className='text-[12px] px-3 py-1 rounded border border-slate-300 hover:bg-slate-50'
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!canSave}
                                    className={`text-[12px] px-3 py-1 rounded ${
                                        canSave
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    }`}
                                    onClick={onSave}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body,
        );
    }, [contactModal, contactDrafts, localRows]);
    // removed fill down state

    const startResize = (
        colKey: string,
        e: React.MouseEvent<HTMLDivElement>,
    ) => {
        e.preventDefault();
        e.stopPropagation();
        const parent = (e.currentTarget as HTMLDivElement).parentElement;
        const startX = e.clientX;
        const startWidth = parent ? parent.getBoundingClientRect().width : 120;
        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            const next = Math.max(70, startWidth + delta);
            setColWidths((m) => ({...m, [colKey]: next}));
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    // removed fill handlers

    const toggleExpanded = (id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const isSectionOpen = (
        id: string,
        key: 'address' | 'technical' | 'license',
    ): boolean => {
        const o = sectionOpen[id];
        return o ? !!o[key] : false;
    };
    const toggleSection = (
        id: string,
        key: 'address' | 'technical' | 'license',
    ) => {
        setSectionOpen((prev) => {
            const base = prev[id] || {
                address: false,
                technical: false,
                license: false,
            };
            return {
                ...prev,
                [id]: {...base, [key]: !base[key]},
            };
        });
    };

    const highlightText = (text: string) => {
        const q = (highlightQuery || '').trim();
        if (!q) return <>{text}</>;
        try {
            const esc = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
            const re = new RegExp(`(${esc})`, 'ig');
            const parts = text.split(re);
            return (
                <>
                    {parts.map((part, i) =>
                        re.test(part) ? (
                            <mark
                                key={i}
                                className='bg-yellow-200 px-0.5 rounded'
                            >
                                {part}
                            </mark>
                        ) : (
                            <span key={i}>{part}</span>
                        ),
                    )}
                </>
            );
        } catch {
            return <>{text}</>;
        }
    };
    const [sortCol, setSortCol] = useState<
        | 'accountName'
        | 'email'
        | 'status'
        | 'servicesCount'
        | 'enterpriseName'
        | 'servicesSummary'
        | null
    >(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

    const toggleSort = (
        col:
            | 'accountName'
            | 'email'
            | 'status'
            | 'servicesCount'
            | 'enterpriseName'
            | 'servicesSummary',
    ) => {
        const nextDir: 'asc' | 'desc' =
            sortCol === col && sortDir === 'asc' ? 'desc' : 'asc';
        setSortCol(col);
        setSortDir(nextDir);
    };

    const displayItems = useMemo(() => {
        const base = [...orderedItems];
        if (!sortCol || !sortDir) return base;
        base.sort((a, b) => {
            const av = String((a as any)[sortCol] ?? '');
            const bv = String((b as any)[sortCol] ?? '');
            const comp = av.localeCompare(bv, undefined, {
                numeric: true,
                sensitivity: 'base',
            });
            return sortDir === 'asc' ? comp : -comp;
        });
        return base;
    }, [orderedItems, sortCol, sortDir]);

    return (
        <div className='w-full compact-table safari-tight'>
            <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-semibold text-slate-800'>
                    {title ?? 'Accounts'}
                </h3>
                <div className='flex items-center gap-2'>
                    {/* Quick add row button removed per request */}
                    {!hideControls && (
                        <div className='flex items-center gap-1 text-[11px]'>
                            <span className='text-slate-500 mr-1'>
                                Group by:
                            </span>
                            <button
                                onClick={() => {
                                    setGroupBy('none');
                                    onGroupByChange && onGroupByChange('none');
                                }}
                                className={`px-2 py-1 rounded-md border ${
                                    groupBy === 'none'
                                        ? 'bg-slate-200 border-slate-300'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                None
                            </button>
                            <button
                                onClick={() => {
                                    setGroupBy('enterpriseName');
                                    onGroupByChange &&
                                        onGroupByChange('enterpriseName');
                                }}
                                className={`px-2 py-1 rounded-md border ${
                                    groupBy === 'enterpriseName'
                                        ? 'bg-slate-200 border-slate-300'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                Enterprise
                            </button>
                            <button
                                onClick={() => {
                                    setGroupBy('productName');
                                    onGroupByChange &&
                                        onGroupByChange('productName');
                                }}
                                className={`px-2 py-1 rounded-md border ${
                                    groupBy === 'productName'
                                        ? 'bg-slate-200 border-slate-300'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                Product
                            </button>
                            <button
                                onClick={() => {
                                    setGroupBy('serviceName');
                                    onGroupByChange &&
                                        onGroupByChange('serviceName');
                                }}
                                className={`px-2 py-1 rounded-md border ${
                                    groupBy === 'serviceName'
                                        ? 'bg-slate-200 border-slate-300'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                Service
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div role='table' className='p-0 overflow-x-auto'>
                <div className='w-full relative'>
                    {(() => {
                        const cssTemplate = gridTemplate.split('_').join(' ');
                        const labelFor: Record<string, string> = {
                            contact: 'Client',
                            accountName: 'Account',
                            country: 'Country',
                            addressLine1: 'Address Line 1',
                            addressLine2: 'Address Line 2',
                            city: 'City',
                            state: 'State',
                            pincode: 'PIN/ZIP',
                        };
                        return (
                            <div className='rounded-xl border border-slate-300 shadow-sm bg-white pb-1'>
                                <div
                                    className='sticky top-0 z-30 grid w-full overflow-visible gap-0 px-0 py-2 text-xs font-semibold text-slate-900 bg-white/90 supports-[backdrop-filter]:backdrop-blur-sm border-b border-slate-200 divide-x divide-slate-200 shadow-sm'
                                    style={{gridTemplateColumns: cssTemplate}}
                                >
                                    {cols.map((c, idx) => (
                                        <div
                                            key={c}
                                            className={`relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-slate-50 transition-colors duration-150 group ${
                                                idx === 0 && pinFirst
                                                    ? 'sticky left-0 z-20 bg-sky-50/80 backdrop-blur-sm border-l-4 border-l-slate-200 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)] after:content-[" "] after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-slate-200'
                                                    : ''
                                            }`}
                                            style={
                                                idx === 0
                                                    ? {
                                                          width: firstColWidth,
                                                          minWidth:
                                                              firstColWidth,
                                                          maxWidth:
                                                              firstColWidth,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <span>{labelFor[c] || c}</span>
                                            {idx === 0 && (
                                                <button
                                                    className='ml-1 p-1 rounded hover:bg-slate-100 text-slate-600'
                                                    onClick={() =>
                                                        setPinFirst((v) => !v)
                                                    }
                                                    title={
                                                        pinFirst
                                                            ? 'Unfreeze column'
                                                            : 'Freeze column'
                                                    }
                                                >
                                                    {pinFirst ? (
                                                        <Pin className='w-3.5 h-3.5' />
                                                    ) : (
                                                        <PinOff className='w-3.5 h-3.5' />
                                                    )}
                                                </button>
                                            )}
                                            {[
                                                'accountName',
                                                'email',
                                                'enterpriseName',
                                            ].includes(c) && (
                                                <button
                                                    onClick={() =>
                                                        toggleSort(c as any)
                                                    }
                                                    className='inline-flex items-center -mr-1'
                                                >
                                                    <ArrowUp
                                                        className={`w-3 h-3 ${
                                                            sortCol ===
                                                                (c as any) &&
                                                            sortDir === 'asc'
                                                                ? 'text-sky-600'
                                                                : 'text-slate-400'
                                                        }`}
                                                    />
                                                    <ArrowDown
                                                        className={`w-3 h-3 ${
                                                            sortCol ===
                                                                (c as any) &&
                                                            sortDir === 'desc'
                                                                ? 'text-sky-600'
                                                                : 'text-slate-400'
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                            <div
                                                onMouseDown={(e) =>
                                                    startResize(c, e)
                                                }
                                                className='ml-auto h-4 w-1.5 cursor-col-resize bg-gradient-to-b from-slate-300 to-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150'
                                                title='Resize column'
                                            />
                                            {c === 'accountName' && (
                                                <span
                                                    aria-hidden
                                                    className='pointer-events-none absolute right-0 top-0 h-full w-px bg-slate-200/80'
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {customColumns.map((name, idx) => (
                                        <div
                                            key={`custom-${idx}`}
                                            className='min-w-0'
                                        >
                                            {name}
                                        </div>
                                    ))}
                                    {/* trailing add column removed */}
                                </div>
                            </div>
                        );
                    })()}
                    {groupBy === 'none' ? (
                        <Reorder.Group
                            axis='y'
                            values={orderedItems.map((i) => i.id)}
                            onReorder={(ids) => setOrder(ids as string[])}
                            className='space-y-0 divide-y divide-slate-200'
                            transition={{
                                layout: {
                                    duration: 0.22,
                                    ease: [0.22, 1, 0.36, 1],
                                },
                                type: 'spring',
                                stiffness: 420,
                                damping: 28,
                                mass: 0.65,
                            }}
                            layoutScroll
                            layout
                        >
                            {displayItems.map((r, idx) => (
                                <>
                                    <SortableAccountRow
                                        key={r.id}
                                        row={r}
                                        index={idx}
                                        cols={cols}
                                        gridTemplate={gridTemplate}
                                        highlightQuery={highlightQuery}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onQuickAddRow={onQuickAddRow}
                                        customColumns={customColumns}
                                        pinFirst={pinFirst}
                                        firstColWidth={firstColWidth}
                                        isExpanded={expandedRows.has(r.id)}
                                        onToggle={toggleExpanded}
                                        expandedContent={
                                            <div className='relative bg-white px-2 py-3 pl-6 rounded-md border border-slate-200 shadow-sm'>
                                                <motion.div
                                                    layout
                                                    initial={{
                                                        scaleY: 0,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        scaleY: 1,
                                                        opacity: 1,
                                                    }}
                                                    transition={{
                                                        duration: 0.28,
                                                        ease: [
                                                            0.22, 1, 0.36, 1,
                                                        ],
                                                    }}
                                                    className='absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-sky-400 via-emerald-400 to-violet-400 origin-top'
                                                />
                                                {/* Address section removed in favor of parent columns */}
                                                {/* Technical */}
                                                <div className='relative mb-4'>
                                                    <motion.div
                                                        layout
                                                        initial={{
                                                            scaleX: 0,
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            scaleX: isSectionOpen(
                                                                r.id,
                                                                'technical',
                                                            )
                                                                ? [0, 1]
                                                                : [1, 0.6],
                                                            opacity:
                                                                isSectionOpen(
                                                                    r.id,
                                                                    'technical',
                                                                )
                                                                    ? [0.4, 1]
                                                                    : [1, 0.6],
                                                        }}
                                                        viewport={{once: true}}
                                                        transition={{
                                                            duration: 0.25,
                                                            ease: 'easeOut',
                                                        }}
                                                        className='absolute -left-3 top-4 w-3 h-px bg-gradient-to-r from-sky-400 to-emerald-400 origin-left'
                                                    />
                                                    <motion.div
                                                        layout
                                                        initial={{
                                                            scale: 0.6,
                                                            opacity: 0.6,
                                                        }}
                                                        animate={
                                                            isSectionOpen(
                                                                r.id,
                                                                'technical',
                                                            )
                                                                ? {
                                                                      scale: [
                                                                          0.7,
                                                                          1.1,
                                                                          1,
                                                                      ],
                                                                      opacity: [
                                                                          0.7,
                                                                          1, 1,
                                                                      ],
                                                                  }
                                                                : {
                                                                      scale: 0.8,
                                                                      opacity: 0.7,
                                                                  }
                                                        }
                                                        transition={{
                                                            times: [
                                                                0, 0.5, 0.8, 1,
                                                            ],
                                                            duration: 0.45,
                                                            ease: 'easeOut',
                                                        }}
                                                        className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_#fff]'
                                                    />
                                                    <div className='flex items-center gap-1 text-[11px] font-semibold text-slate-700 mb-1'>
                                                        <button
                                                            className='p-0.5 rounded hover:bg-slate-100'
                                                            onClick={() =>
                                                                toggleSection(
                                                                    r.id,
                                                                    'technical',
                                                                )
                                                            }
                                                            title='Toggle technical user'
                                                        >
                                                            <motion.span
                                                                initial={false}
                                                                animate={{
                                                                    rotate: isSectionOpen(
                                                                        r.id,
                                                                        'technical',
                                                                    )
                                                                        ? 90
                                                                        : 0,
                                                                }}
                                                                transition={{
                                                                    type: 'spring',
                                                                    stiffness: 520,
                                                                    damping: 30,
                                                                }}
                                                                className='inline-flex'
                                                            >
                                                                <ChevronRight className='h-3.5 w-3.5 text-slate-600' />
                                                            </motion.span>
                                                        </button>
                                                        Technical User
                                                    </div>
                                                    {isSectionOpen(
                                                        r.id,
                                                        'technical',
                                                    ) && (
                                                        <div className='border rounded-md overflow-hidden'>
                                                            <div
                                                                className='grid text-[10px] bg-slate-50 text-slate-700 px-2 py-1 divide-x divide-slate-200'
                                                                style={{
                                                                    gridTemplateColumns:
                                                                        'repeat(2,minmax(130px,1fr))',
                                                                }}
                                                            >
                                                                <div>
                                                                    Technical
                                                                    User Name
                                                                </div>
                                                                <div>
                                                                    Technical
                                                                    User Email
                                                                </div>
                                                            </div>
                                                            <div
                                                                className='grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200'
                                                                style={{
                                                                    gridTemplateColumns:
                                                                        'repeat(2,minmax(130px,1fr))',
                                                                }}
                                                            >
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <InlineEditableText
                                                                        value={
                                                                            r
                                                                                .technical
                                                                                ?.username ||
                                                                            ''
                                                                        }
                                                                        onCommit={(
                                                                            v,
                                                                        ) =>
                                                                            updateRowNested(
                                                                                r.id,
                                                                                [
                                                                                    'technical',
                                                                                    'username',
                                                                                ],
                                                                                v,
                                                                            )
                                                                        }
                                                                        placeholder='Technical User Name'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2'>
                                                                    <InlineEditableText
                                                                        value={
                                                                            r
                                                                                .technical
                                                                                ?.email ||
                                                                            ''
                                                                        }
                                                                        onCommit={(
                                                                            v,
                                                                        ) =>
                                                                            updateRowNested(
                                                                                r.id,
                                                                                [
                                                                                    'technical',
                                                                                    'email',
                                                                                ],
                                                                                v,
                                                                            )
                                                                        }
                                                                        placeholder='Technical User Email'
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* License */}
                                                <div className='relative'>
                                                    <motion.div
                                                        layout
                                                        initial={{
                                                            scaleX: 0,
                                                            opacity: 0,
                                                        }}
                                                        whileInView={{
                                                            scaleX: 1,
                                                            opacity: 1,
                                                        }}
                                                        viewport={{once: true}}
                                                        transition={{
                                                            duration: 0.25,
                                                        }}
                                                        className='absolute -left-3 top-4 w-3 h-px bg-gradient-to-r from-violet-400 to-amber-400 origin-left'
                                                    />
                                                    <motion.div
                                                        layout
                                                        initial={{
                                                            scale: 0,
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            scale: 1,
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 420,
                                                            damping: 24,
                                                        }}
                                                        className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_0_2px_#fff]'
                                                    />
                                                    <div className='flex items-center gap-1 text-[11px] font-semibold text-slate-700 mb-1'>
                                                        <button
                                                            className='p-0.5 rounded hover:bg-slate-100'
                                                            onClick={() =>
                                                                toggleSection(
                                                                    r.id,
                                                                    'license',
                                                                )
                                                            }
                                                            title='Toggle license details'
                                                        >
                                                            <motion.span
                                                                initial={false}
                                                                animate={{
                                                                    rotate: isSectionOpen(
                                                                        r.id,
                                                                        'license',
                                                                    )
                                                                        ? 90
                                                                        : 0,
                                                                }}
                                                                transition={{
                                                                    type: 'spring',
                                                                    stiffness: 520,
                                                                    damping: 30,
                                                                }}
                                                                className='inline-flex'
                                                            >
                                                                <ChevronRight className='h-3.5 w-3.5 text-slate-600' />
                                                            </motion.span>
                                                        </button>
                                                        License Details
                                                    </div>
                                                    {isSectionOpen(
                                                        r.id,
                                                        'license',
                                                    ) && (
                                                        <div className='border rounded-md overflow-hidden bg-gradient-to-b from-white to-slate-50'>
                                                            {(() => {
                                                                const hasRenewal =
                                                                    (
                                                                        r.licenses ||
                                                                        []
                                                                    ).some(
                                                                        (l) =>
                                                                            !!l.renewalNotice,
                                                                    );
                                                                return (
                                                                    <div
                                                                        className='grid text-[10px] bg-slate-100/90 text-slate-800 px-2 py-1 divide-x divide-slate-200'
                                                                        style={{
                                                                            gridTemplateColumns: `repeat(${
                                                                                hasRenewal
                                                                                    ? 9
                                                                                    : 8
                                                                            },minmax(88px,1fr))`,
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            Enterprise
                                                                        </div>
                                                                        <div>
                                                                            Product
                                                                        </div>
                                                                        <div>
                                                                            Service
                                                                        </div>
                                                                        <div>
                                                                            License
                                                                            Start
                                                                            Date
                                                                        </div>
                                                                        <div>
                                                                            License
                                                                            Expiration
                                                                            Date
                                                                        </div>
                                                                        <div>
                                                                            Number
                                                                            of
                                                                            Users
                                                                        </div>
                                                                        <div>
                                                                            Renewal
                                                                            Notice
                                                                        </div>
                                                                        <div>
                                                                            Contact
                                                                            Details
                                                                        </div>
                                                                        {hasRenewal && (
                                                                            <div>
                                                                                Notice
                                                                                Period
                                                                                (days)
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                            {(r.licenses || [])
                                                                .length > 0 ? (
                                                                <div className='divide-y divide-slate-200'>
                                                                    {(() => {
                                                                        const hasRenewal =
                                                                            (
                                                                                r.licenses ||
                                                                                []
                                                                            ).some(
                                                                                (
                                                                                    l,
                                                                                ) =>
                                                                                    !!l.renewalNotice,
                                                                            );
                                                                        return (
                                                                            <>
                                                                                {(
                                                                                    r.licenses ||
                                                                                    []
                                                                                ).map(
                                                                                    (
                                                                                        lic,
                                                                                        i,
                                                                                    ) => (
                                                                                        <div
                                                                                            key={
                                                                                                i
                                                                                            }
                                                                                            className={`grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200 ${
                                                                                                i %
                                                                                                    2 ===
                                                                                                0
                                                                                                    ? 'bg-white'
                                                                                                    : 'bg-slate-50/60'
                                                                                            }`}
                                                                                            style={{
                                                                                                gridTemplateColumns: `repeat(${
                                                                                                    hasRenewal
                                                                                                        ? 9
                                                                                                        : 8
                                                                                                },minmax(88px,1fr))`,
                                                                                            }}
                                                                                        >
                                                                                            <div className='px-2 py-2 border-r border-slate-200 min-w-0 overflow-hidden'>
                                                                                                <div className='flex items-center gap-1 min-w-0'>
                                                                                                    {/* contact chevron removed */}
                                                                                                    <AsyncChipSelect
                                                                                                        type='enterprise'
                                                                                                        value={
                                                                                                            lic.enterprise ||
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            v,
                                                                                                        ) =>
                                                                                                            updateLicenseField(
                                                                                                                r.id,
                                                                                                                i,
                                                                                                                'enterprise',
                                                                                                                v ||
                                                                                                                    '',
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder='Select enterprise'
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className='px-2 py-2 border-r border-slate-200 min-w-0 overflow-hidden'>
                                                                                                <AsyncChipSelect
                                                                                                    type='product'
                                                                                                    value={
                                                                                                        lic.product ||
                                                                                                        ''
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        v,
                                                                                                    ) =>
                                                                                                        updateLicenseField(
                                                                                                            r.id,
                                                                                                            i,
                                                                                                            'product',
                                                                                                            v ||
                                                                                                                '',
                                                                                                        )
                                                                                                    }
                                                                                                    placeholder='Select product'
                                                                                                />
                                                                                            </div>
                                                                                            <div className='px-2 py-2 border-r border-slate-200 min-w-0 overflow-hidden'>
                                                                                                <AsyncChipSelect
                                                                                                    type='service'
                                                                                                    value={
                                                                                                        lic.service ||
                                                                                                        ''
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        v,
                                                                                                    ) =>
                                                                                                        updateLicenseField(
                                                                                                            r.id,
                                                                                                            i,
                                                                                                            'service',
                                                                                                            v ||
                                                                                                                '',
                                                                                                        )
                                                                                                    }
                                                                                                    placeholder='Select service'
                                                                                                />
                                                                                            </div>
                                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                <input
                                                                                                    type='date'
                                                                                                    value={
                                                                                                        lic.licenseStart ||
                                                                                                        ''
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        e,
                                                                                                    ) =>
                                                                                                        updateLicenseField(
                                                                                                            r.id,
                                                                                                            i,
                                                                                                            'licenseStart',
                                                                                                            e
                                                                                                                .target
                                                                                                                .value,
                                                                                                        )
                                                                                                    }
                                                                                                    className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                                />
                                                                                            </div>
                                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                <input
                                                                                                    type='date'
                                                                                                    value={
                                                                                                        lic.licenseEnd ||
                                                                                                        ''
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        e,
                                                                                                    ) =>
                                                                                                        updateLicenseField(
                                                                                                            r.id,
                                                                                                            i,
                                                                                                            'licenseEnd',
                                                                                                            e
                                                                                                                .target
                                                                                                                .value,
                                                                                                        )
                                                                                                    }
                                                                                                    className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                                />
                                                                                            </div>
                                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                <InlineEditableText
                                                                                                    value={
                                                                                                        typeof lic.users ===
                                                                                                        'number'
                                                                                                            ? String(
                                                                                                                  lic.users,
                                                                                                              )
                                                                                                            : ''
                                                                                                    }
                                                                                                    onCommit={(
                                                                                                        v,
                                                                                                    ) =>
                                                                                                        updateLicenseField(
                                                                                                            r.id,
                                                                                                            i,
                                                                                                            'users',
                                                                                                            parseInt(
                                                                                                                v ||
                                                                                                                    '0',
                                                                                                                10,
                                                                                                            ),
                                                                                                        )
                                                                                                    }
                                                                                                    placeholder='Users'
                                                                                                    className='w-full'
                                                                                                />
                                                                                            </div>
                                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                <label className='inline-flex items-center gap-1 text-[12px] text-slate-700'>
                                                                                                    <input
                                                                                                        type='checkbox'
                                                                                                        defaultChecked={
                                                                                                            !!lic.renewalNotice
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            e,
                                                                                                        ) =>
                                                                                                            updateLicenseField(
                                                                                                                r.id,
                                                                                                                i,
                                                                                                                'renewalNotice',
                                                                                                                e
                                                                                                                    .target
                                                                                                                    .checked,
                                                                                                            )
                                                                                                        }
                                                                                                    />
                                                                                                    <span>
                                                                                                        Notify
                                                                                                    </span>
                                                                                                </label>
                                                                                            </div>
                                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                <button
                                                                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full border hover:bg-slate-50 ${
                                                                                                        (
                                                                                                            lic.contacts ||
                                                                                                            []
                                                                                                        )
                                                                                                            .length >
                                                                                                        0
                                                                                                            ? 'border-emerald-400 text-emerald-600'
                                                                                                            : 'border-slate-300'
                                                                                                    }`}
                                                                                                    title='Contact details'
                                                                                                    onClick={() => {
                                                                                                        if (
                                                                                                            typeof document !==
                                                                                                            'undefined'
                                                                                                        ) {
                                                                                                            document.dispatchEvent(
                                                                                                                new CustomEvent(
                                                                                                                    'contact-modal-open',
                                                                                                                    {
                                                                                                                        detail: {
                                                                                                                            rowId: r.id,
                                                                                                                            licIndex:
                                                                                                                                i,
                                                                                                                        },
                                                                                                                    },
                                                                                                                ),
                                                                                                            );
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <svg
                                                                                                        width='14'
                                                                                                        height='14'
                                                                                                        viewBox='0 0 24 24'
                                                                                                        fill='none'
                                                                                                        xmlns='http://www.w3.org/2000/svg'
                                                                                                    >
                                                                                                        <path
                                                                                                            d='M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-3.33 0-10 1.667-10 5v2h20v-2c0-3.333-6.67-5-10-5Z'
                                                                                                            stroke='currentColor'
                                                                                                            strokeWidth='1.5'
                                                                                                            strokeLinecap='round'
                                                                                                            strokeLinejoin='round'
                                                                                                        />
                                                                                                    </svg>
                                                                                                </button>
                                                                                            </div>
                                                                                            {hasRenewal && (
                                                                                                <div className='px-2 py-2'>
                                                                                                    {lic.renewalNotice ? (
                                                                                                        <InlineEditableText
                                                                                                            value={
                                                                                                                lic.noticeDays
                                                                                                                    ? String(
                                                                                                                          lic.noticeDays,
                                                                                                                      )
                                                                                                                    : ''
                                                                                                            }
                                                                                                            onCommit={(
                                                                                                                v,
                                                                                                            ) =>
                                                                                                                updateLicenseField(
                                                                                                                    r.id,
                                                                                                                    i,
                                                                                                                    'noticeDays',
                                                                                                                    parseInt(
                                                                                                                        v ||
                                                                                                                            '0',
                                                                                                                        10,
                                                                                                                    ),
                                                                                                                )
                                                                                                            }
                                                                                                            placeholder='Days'
                                                                                                            className='w-full'
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <span className='text-slate-300'>
                                                                                                            —
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                            {/* Per-license Contacts toggle and panel */}
                                                                                            <div className='col-span-full border-t px-2 py-1'>
                                                                                                {/* Contact details chevron and panel removed */}
                                                                                                {false && (
                                                                                                    <div className='mt-2 border rounded-md overflow-hidden'>
                                                                                                        <div
                                                                                                            className='grid text-[10px] bg-slate-50 text-slate-700 px-2 py-1 divide-x divide-slate-200'
                                                                                                            style={{
                                                                                                                gridTemplateColumns:
                                                                                                                    'repeat(4,minmax(140px,1fr))',
                                                                                                            }}
                                                                                                        >
                                                                                                            <div>
                                                                                                                Contact
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                Title
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                Email
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                Phone
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className='divide-y border-t border-slate-200'>
                                                                                                            {(
                                                                                                                lic.contacts ||
                                                                                                                []
                                                                                                            ).map(
                                                                                                                (
                                                                                                                    c,
                                                                                                                    ci,
                                                                                                                ) => (
                                                                                                                    <div
                                                                                                                        key={
                                                                                                                            ci
                                                                                                                        }
                                                                                                                        className='grid text-[12px] text-slate-800 px-0 py-0'
                                                                                                                        style={{
                                                                                                                            gridTemplateColumns:
                                                                                                                                'repeat(4,minmax(140px,1fr))',
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                                            <InlineEditableText
                                                                                                                                value={
                                                                                                                                    c.contact ||
                                                                                                                                    ''
                                                                                                                                }
                                                                                                                                onCommit={(
                                                                                                                                    v,
                                                                                                                                ) =>
                                                                                                                                    updateLicenseContactField(
                                                                                                                                        r.id,
                                                                                                                                        i,
                                                                                                                                        ci,
                                                                                                                                        'contact',
                                                                                                                                        v,
                                                                                                                                    )
                                                                                                                                }
                                                                                                                                placeholder='Contact name'
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                                            <InlineEditableText
                                                                                                                                value={
                                                                                                                                    c.title ||
                                                                                                                                    ''
                                                                                                                                }
                                                                                                                                onCommit={(
                                                                                                                                    v,
                                                                                                                                ) =>
                                                                                                                                    updateLicenseContactField(
                                                                                                                                        r.id,
                                                                                                                                        i,
                                                                                                                                        ci,
                                                                                                                                        'title',
                                                                                                                                        v,
                                                                                                                                    )
                                                                                                                                }
                                                                                                                                placeholder='Title'
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                                            <InlineEditableText
                                                                                                                                value={
                                                                                                                                    c.email ||
                                                                                                                                    ''
                                                                                                                                }
                                                                                                                                onCommit={(
                                                                                                                                    v,
                                                                                                                                ) =>
                                                                                                                                    updateLicenseContactField(
                                                                                                                                        r.id,
                                                                                                                                        i,
                                                                                                                                        ci,
                                                                                                                                        'email',
                                                                                                                                        v,
                                                                                                                                    )
                                                                                                                                }
                                                                                                                                placeholder='email@company.com'
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                        <div className='px-2 py-2'>
                                                                                                                            <InlineEditableText
                                                                                                                                value={
                                                                                                                                    c.phone ||
                                                                                                                                    ''
                                                                                                                                }
                                                                                                                                onCommit={(
                                                                                                                                    v,
                                                                                                                                ) =>
                                                                                                                                    updateLicenseContactField(
                                                                                                                                        r.id,
                                                                                                                                        i,
                                                                                                                                        ci,
                                                                                                                                        'phone',
                                                                                                                                        v,
                                                                                                                                    )
                                                                                                                                }
                                                                                                                                placeholder='Phone number'
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                ),
                                                                                                            )}
                                                                                                            <div className='px-2 py-2'>
                                                                                                                <button
                                                                                                                    className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                                                                    onClick={() =>
                                                                                                                        addLicenseContactRow(
                                                                                                                            r.id,
                                                                                                                            i,
                                                                                                                        )
                                                                                                                    }
                                                                                                                >
                                                                                                                    +
                                                                                                                    Add
                                                                                                                    contact
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ),
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                    <div className='px-2 py-2'>
                                                                        <button
                                                                            className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                            onClick={() => {
                                                                                setLocalRows(
                                                                                    (
                                                                                        prev,
                                                                                    ) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                row,
                                                                                            ) => {
                                                                                                if (
                                                                                                    row.id !==
                                                                                                    r.id
                                                                                                )
                                                                                                    return row;
                                                                                                const list =
                                                                                                    [
                                                                                                        ...(((
                                                                                                            row as any
                                                                                                        )
                                                                                                            .licenses as any[]) ||
                                                                                                            []),
                                                                                                    ];
                                                                                                list.push(
                                                                                                    {
                                                                                                        enterprise:
                                                                                                            '',
                                                                                                        product:
                                                                                                            '',
                                                                                                        service:
                                                                                                            '',
                                                                                                        licenseStart:
                                                                                                            '',
                                                                                                        licenseEnd:
                                                                                                            '',
                                                                                                        users: 0,
                                                                                                        renewalNotice:
                                                                                                            false,
                                                                                                        noticeDays: 0,
                                                                                                    } as any,
                                                                                                );
                                                                                                return {
                                                                                                    ...(row as any),
                                                                                                    licenses:
                                                                                                        list,
                                                                                                } as AccountRow;
                                                                                            },
                                                                                        ),
                                                                                );
                                                                            }}
                                                                        >
                                                                            +
                                                                            Add
                                                                            license
                                                                            row
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className='border-t'>
                                                                    {/* Placeholder editable row index 0 */}
                                                                    <div
                                                                        className='grid text-[12px] text-slate-800 px-0 py-0'
                                                                        style={{
                                                                            gridTemplateColumns: `repeat(${
                                                                                (
                                                                                    r.licenses ||
                                                                                    []
                                                                                ).some(
                                                                                    (
                                                                                        l,
                                                                                    ) =>
                                                                                        !!l.renewalNotice,
                                                                                )
                                                                                    ? 8
                                                                                    : 7
                                                                            },minmax(88px,1fr))`,
                                                                        }}
                                                                    >
                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                            <AsyncChipSelect
                                                                                type='enterprise'
                                                                                value={
                                                                                    ''
                                                                                }
                                                                                onChange={(
                                                                                    v,
                                                                                ) =>
                                                                                    updateLicenseField(
                                                                                        r.id,
                                                                                        0,
                                                                                        'enterprise',
                                                                                        v ||
                                                                                            '',
                                                                                    )
                                                                                }
                                                                                placeholder='Select enterprise'
                                                                            />
                                                                        </div>
                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                            <AsyncChipSelect
                                                                                type='product'
                                                                                value={
                                                                                    ''
                                                                                }
                                                                                onChange={(
                                                                                    v,
                                                                                ) =>
                                                                                    updateLicenseField(
                                                                                        r.id,
                                                                                        0,
                                                                                        'product',
                                                                                        v ||
                                                                                            '',
                                                                                    )
                                                                                }
                                                                                placeholder='Select product'
                                                                            />
                                                                        </div>
                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                            <AsyncChipSelect
                                                                                type='service'
                                                                                value={
                                                                                    ''
                                                                                }
                                                                                onChange={(
                                                                                    v,
                                                                                ) =>
                                                                                    updateLicenseField(
                                                                                        r.id,
                                                                                        0,
                                                                                        'service',
                                                                                        v ||
                                                                                            '',
                                                                                    )
                                                                                }
                                                                                placeholder='Select service'
                                                                            />
                                                                        </div>
                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                            <input
                                                                                type='date'
                                                                                defaultValue=''
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateLicenseField(
                                                                                        r.id,
                                                                                        0,
                                                                                        'licenseStart',
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                            />
                                                                        </div>
                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                            <input
                                                                                type='date'
                                                                                defaultValue=''
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateLicenseField(
                                                                                        r.id,
                                                                                        0,
                                                                                        'licenseEnd',
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                            />
                                                                        </div>
                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                            <input
                                                                                defaultValue=''
                                                                                onBlur={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateLicenseField(
                                                                                        r.id,
                                                                                        0,
                                                                                        'users',
                                                                                        parseInt(
                                                                                            e
                                                                                                .target
                                                                                                .value ||
                                                                                                '0',
                                                                                            10,
                                                                                        ),
                                                                                    )
                                                                                }
                                                                                placeholder='Users'
                                                                                className='w-full'
                                                                            />
                                                                        </div>
                                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                                            <label className='inline-flex items-center gap-1 text-[12px] text-slate-700'>
                                                                                <input
                                                                                    type='checkbox'
                                                                                    defaultChecked={
                                                                                        false
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateLicenseField(
                                                                                            r.id,
                                                                                            0,
                                                                                            'renewalNotice',
                                                                                            e
                                                                                                .target
                                                                                                .checked,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <span>
                                                                                    Notify
                                                                                </span>
                                                                            </label>
                                                                        </div>
                                                                        {(
                                                                            r.licenses ||
                                                                            []
                                                                        ).some(
                                                                            (
                                                                                l,
                                                                            ) =>
                                                                                !!l.renewalNotice,
                                                                        ) && (
                                                                            <div className='px-2 py-2'>
                                                                                <InlineEditableText
                                                                                    value={
                                                                                        ''
                                                                                    }
                                                                                    onCommit={(
                                                                                        v,
                                                                                    ) =>
                                                                                        updateLicenseField(
                                                                                            r.id,
                                                                                            0,
                                                                                            'noticeDays',
                                                                                            parseInt(
                                                                                                v ||
                                                                                                    '0',
                                                                                                10,
                                                                                            ),
                                                                                        )
                                                                                    }
                                                                                    placeholder='Days'
                                                                                    className='w-full'
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className='px-2 py-2'>
                                                                        <button
                                                                            className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                            onClick={() => {
                                                                                setLocalRows(
                                                                                    (
                                                                                        prev,
                                                                                    ) =>
                                                                                        prev.map(
                                                                                            (
                                                                                                row,
                                                                                            ) => {
                                                                                                if (
                                                                                                    row.id !==
                                                                                                    r.id
                                                                                                )
                                                                                                    return row;
                                                                                                const list =
                                                                                                    [
                                                                                                        ...(((
                                                                                                            row as any
                                                                                                        )
                                                                                                            .licenses as any[]) ||
                                                                                                            []),
                                                                                                    ];
                                                                                                list.push(
                                                                                                    {
                                                                                                        enterprise:
                                                                                                            '',
                                                                                                        product:
                                                                                                            '',
                                                                                                        service:
                                                                                                            '',
                                                                                                        licenseStart:
                                                                                                            '',
                                                                                                        licenseEnd:
                                                                                                            '',
                                                                                                        users: 0,
                                                                                                        renewalNotice:
                                                                                                            false,
                                                                                                        noticeDays: 0,
                                                                                                    } as any,
                                                                                                );
                                                                                                return {
                                                                                                    ...(row as any),
                                                                                                    licenses:
                                                                                                        list,
                                                                                                } as AccountRow;
                                                                                            },
                                                                                        ),
                                                                                );
                                                                            }}
                                                                        >
                                                                            +
                                                                            Add
                                                                            license
                                                                            row
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        }
                                        onUpdateField={updateRowField}
                                        isSelected={selectedRowId === r.id}
                                        onSelect={(id) => setSelectedRowId(id)}
                                        onStartFill={() => {}}
                                        inFillRange={false}
                                    />
                                    {expandedRows.has(r.id) && (
                                        <div className='group relative bg-white border-t border-slate-200 px-2 py-3 pl-6 hidden'>
                                            <div className='absolute left-3 top-0 bottom-0 w-px bg-slate-500 transition-colors duration-300 group-hover:bg-sky-500'></div>
                                            {/* Address Details Subtable */}
                                            <div className='relative mb-4'>
                                                <div className='absolute -left-3 top-4 w-3 h-px bg-slate-500 transition-colors duration-300 group-hover:bg-sky-500'></div>
                                                <div className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-white border border-slate-300'></div>
                                                <div className='text-[11px] font-semibold text-slate-700 mb-1'>
                                                    Address Details
                                                </div>
                                                <div className='border rounded-md overflow-hidden'>
                                                    <div
                                                        className='grid text-[10px] bg-slate-100/90 text-slate-800 px-2 py-1 divide-x divide-slate-200'
                                                        style={{
                                                            gridTemplateColumns:
                                                                'repeat(6,minmax(88px,1fr))',
                                                        }}
                                                    >
                                                        <div>
                                                            Address Line 1
                                                        </div>
                                                        <div>
                                                            Address Line 2
                                                        </div>
                                                        <div>Country</div>
                                                        <div>State</div>
                                                        <div>City</div>
                                                        <div>PIN/ZIP</div>
                                                    </div>
                                                    <div
                                                        className='grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200'
                                                        style={{
                                                            gridTemplateColumns:
                                                                'repeat(6,minmax(88px,1fr))',
                                                        }}
                                                    >
                                                        <div className='px-1.5 py-1 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.address
                                                                        ?.addressLine1 ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'address',
                                                                            'addressLine1',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Address Line 1'
                                                            />
                                                        </div>
                                                        <div className='px-1.5 py-1 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.address
                                                                        ?.addressLine2 ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'address',
                                                                            'addressLine2',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Address Line 2'
                                                            />
                                                        </div>
                                                        <div className='px-1.5 py-1 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.address
                                                                        ?.country ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'address',
                                                                            'country',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Country'
                                                            />
                                                        </div>
                                                        <div className='px-1.5 py-1 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.address
                                                                        ?.state ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'address',
                                                                            'state',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='State'
                                                            />
                                                        </div>
                                                        <div className='px-1.5 py-1 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.address
                                                                        ?.city ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'address',
                                                                            'city',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='City'
                                                            />
                                                        </div>
                                                        <div className='px-1.5 py-1'>
                                                            <input
                                                                defaultValue={
                                                                    r.address
                                                                        ?.pincode ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'address',
                                                                            'pincode',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='PIN/ZIP'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Technical User Subtable */}
                                            <div className='relative mb-4'>
                                                <div className='absolute -left-3 top-4 w-3 h-px bg-slate-500 transition-colors duration-300 group-hover:bg-sky-500'></div>
                                                <div className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-white border border-slate-300'></div>
                                                <div className='text-[11px] font-semibold text-slate-800 mb-1'>
                                                    Technical User
                                                </div>
                                                <div className='border rounded-md overflow-hidden'>
                                                    <div
                                                        className='grid text-[10px] bg-slate-100/90 text-slate-800 px-2 py-1 divide-x divide-slate-200'
                                                        style={{
                                                            gridTemplateColumns:
                                                                'repeat(2,minmax(90px,1fr))',
                                                        }}
                                                    >
                                                        <div>
                                                            Technical User Name
                                                        </div>
                                                        <div>
                                                            Technical User Email
                                                        </div>
                                                    </div>
                                                    <div
                                                        className='grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200'
                                                        style={{
                                                            gridTemplateColumns:
                                                                'repeat(2,minmax(90px,1fr))',
                                                        }}
                                                    >
                                                        <div className='px-1.5 py-1 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.username ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'username',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none placeholder-slate-400 italic'
                                                                placeholder='Technical User Name'
                                                            />
                                                        </div>
                                                        <div className='px-1.5 py-1'>
                                                            <input
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.email ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'email',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none placeholder-slate-400 italic'
                                                                placeholder='Technical User Email'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* License Details Subtable */}
                                            <div className='relative'>
                                                <div className='absolute -left-3 top-4 w-3 h-px bg-slate-400'></div>
                                                <div className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-white border border-slate-300'></div>
                                                <div className='text-[11px] font-semibold text-slate-800 mb-1'>
                                                    License Details
                                                </div>
                                                <div className='border rounded-md overflow-hidden bg-gradient-to-b from-white to-slate-50'>
                                                    {(() => {
                                                        const hasRenewal = (
                                                            r.licenses || []
                                                        ).some(
                                                            (l) =>
                                                                !!l.renewalNotice,
                                                        );
                                                        return (
                                                            <div
                                                                className='grid text-[10px] bg-slate-100/90 text-slate-800 px-2 py-1 divide-x divide-slate-200'
                                                                style={{
                                                                    gridTemplateColumns: `repeat(${
                                                                        hasRenewal
                                                                            ? 8
                                                                            : 7
                                                                    },minmax(88px,1fr))`,
                                                                }}
                                                            >
                                                                <div>
                                                                    Enterprise
                                                                </div>
                                                                <div>
                                                                    Product
                                                                </div>
                                                                <div>
                                                                    Service
                                                                </div>
                                                                <div>
                                                                    License
                                                                    Start Date
                                                                </div>
                                                                <div>
                                                                    License
                                                                    Expiration
                                                                    Date
                                                                </div>
                                                                <div>
                                                                    Number of
                                                                    Users
                                                                </div>
                                                                <div>
                                                                    Renewal
                                                                    Notice
                                                                </div>
                                                                {hasRenewal && (
                                                                    <div>
                                                                        Notice
                                                                        Period
                                                                        (days)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                    {(r.licenses || []).length >
                                                    0 ? (
                                                        <div className='divide-y divide-slate-200'>
                                                            {(() => {
                                                                const hasRenewal =
                                                                    (
                                                                        r.licenses ||
                                                                        []
                                                                    ).some(
                                                                        (l) =>
                                                                            !!l.renewalNotice,
                                                                    );
                                                                return (
                                                                    <>
                                                                        {(
                                                                            r.licenses ||
                                                                            []
                                                                        ).map(
                                                                            (
                                                                                lic,
                                                                                i,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                    className={`grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200 ${
                                                                                        i %
                                                                                            2 ===
                                                                                        0
                                                                                            ? 'bg-white'
                                                                                            : 'bg-slate-50/60'
                                                                                    }`}
                                                                                    style={{
                                                                                        gridTemplateColumns: `repeat(${
                                                                                            hasRenewal
                                                                                                ? 8
                                                                                                : 7
                                                                                        },minmax(88px,1fr))`,
                                                                                    }}
                                                                                >
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <AsyncChipSelect
                                                                                            type='enterprise'
                                                                                            value={
                                                                                                lic.enterprise ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                v,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'enterprise',
                                                                                                    v ||
                                                                                                        '',
                                                                                                )
                                                                                            }
                                                                                            placeholder='Select enterprise'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <AsyncChipSelect
                                                                                            type='product'
                                                                                            value={
                                                                                                lic.product ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                v,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'product',
                                                                                                    v ||
                                                                                                        '',
                                                                                                )
                                                                                            }
                                                                                            placeholder='Select product'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <AsyncChipSelect
                                                                                            type='service'
                                                                                            value={
                                                                                                lic.service ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                v,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'service',
                                                                                                    v ||
                                                                                                        '',
                                                                                                )
                                                                                            }
                                                                                            placeholder='Select service'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <input
                                                                                            type='date'
                                                                                            value={
                                                                                                lic.licenseStart ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'licenseStart',
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                            className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <input
                                                                                            type='date'
                                                                                            value={
                                                                                                lic.licenseEnd ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'licenseEnd',
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                            className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <InlineEditableText
                                                                                            value={
                                                                                                typeof lic.users ===
                                                                                                'number'
                                                                                                    ? String(
                                                                                                          lic.users,
                                                                                                      )
                                                                                                    : ''
                                                                                            }
                                                                                            onCommit={(
                                                                                                v,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'users',
                                                                                                    parseInt(
                                                                                                        v ||
                                                                                                            '0',
                                                                                                        10,
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                            placeholder='Users'
                                                                                            className='w-full'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <label className='inline-flex items-center gap-1 text-[12px] text-slate-700'>
                                                                                            <input
                                                                                                type='checkbox'
                                                                                                defaultChecked={
                                                                                                    !!lic.renewalNotice
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateLicenseField(
                                                                                                        r.id,
                                                                                                        i,
                                                                                                        'renewalNotice',
                                                                                                        e
                                                                                                            .target
                                                                                                            .checked,
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                            <span>
                                                                                                Notify
                                                                                            </span>
                                                                                        </label>
                                                                                    </div>
                                                                                    {hasRenewal && (
                                                                                        <div className='px-2 py-2'>
                                                                                            {lic.renewalNotice ? (
                                                                                                <InlineEditableText
                                                                                                    value={
                                                                                                        lic.noticeDays
                                                                                                            ? String(
                                                                                                                  lic.noticeDays,
                                                                                                              )
                                                                                                            : ''
                                                                                                    }
                                                                                                    onCommit={(
                                                                                                        v,
                                                                                                    ) =>
                                                                                                        updateLicenseField(
                                                                                                            r.id,
                                                                                                            i,
                                                                                                            'noticeDays',
                                                                                                            parseInt(
                                                                                                                v ||
                                                                                                                    '0',
                                                                                                                10,
                                                                                                            ),
                                                                                                        )
                                                                                                    }
                                                                                                    placeholder='Days'
                                                                                                    className='w-full'
                                                                                                />
                                                                                            ) : (
                                                                                                <span className='text-slate-300'>
                                                                                                    —
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                            <div className='px-2 py-2'>
                                                                <button
                                                                    className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                    onClick={() => {
                                                                        setLocalRows(
                                                                            (
                                                                                prev,
                                                                            ) =>
                                                                                prev.map(
                                                                                    (
                                                                                        row,
                                                                                    ) => {
                                                                                        if (
                                                                                            row.id !==
                                                                                            r.id
                                                                                        )
                                                                                            return row;
                                                                                        const list =
                                                                                            [
                                                                                                ...(((
                                                                                                    row as any
                                                                                                )
                                                                                                    .licenses as any[]) ||
                                                                                                    []),
                                                                                            ];
                                                                                        list.push(
                                                                                            {
                                                                                                enterprise:
                                                                                                    '',
                                                                                                product:
                                                                                                    '',
                                                                                                service:
                                                                                                    '',
                                                                                                licenseStart:
                                                                                                    '',
                                                                                                licenseEnd:
                                                                                                    '',
                                                                                                users: 0,
                                                                                                renewalNotice:
                                                                                                    false,
                                                                                                noticeDays: 0,
                                                                                            } as any,
                                                                                        );
                                                                                        return {
                                                                                            ...(row as any),
                                                                                            licenses:
                                                                                                list,
                                                                                        } as AccountRow;
                                                                                    },
                                                                                ),
                                                                        );
                                                                    }}
                                                                >
                                                                    + Add
                                                                    license row
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className='border-t'>
                                                            {/* Placeholder editable row index 0 */}
                                                            <div
                                                                className='grid text-[12px] text-slate-800 px-0 py-0'
                                                                style={{
                                                                    gridTemplateColumns: `repeat(${
                                                                        (
                                                                            r.licenses ||
                                                                            []
                                                                        ).some(
                                                                            (
                                                                                l,
                                                                            ) =>
                                                                                !!l.renewalNotice,
                                                                        )
                                                                            ? 8
                                                                            : 7
                                                                    },minmax(88px,1fr))`,
                                                                }}
                                                            >
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <AsyncChipSelect
                                                                        type='enterprise'
                                                                        value={
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            v,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'enterprise',
                                                                                v ||
                                                                                    '',
                                                                            )
                                                                        }
                                                                        placeholder='Select enterprise'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <AsyncChipSelect
                                                                        type='product'
                                                                        value={
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            v,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'product',
                                                                                v ||
                                                                                    '',
                                                                            )
                                                                        }
                                                                        placeholder='Select product'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <AsyncChipSelect
                                                                        type='service'
                                                                        value={
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            v,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'service',
                                                                                v ||
                                                                                    '',
                                                                            )
                                                                        }
                                                                        placeholder='Select service'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <input
                                                                        type='date'
                                                                        defaultValue=''
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'licenseStart',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <input
                                                                        type='date'
                                                                        defaultValue=''
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'licenseEnd',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <input
                                                                        defaultValue=''
                                                                        onBlur={(
                                                                            e,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'users',
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value ||
                                                                                        '0',
                                                                                    10,
                                                                                ),
                                                                            )
                                                                        }
                                                                        placeholder='Users'
                                                                        className='w-full'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <label className='inline-flex items-center gap-1 text-[12px] text-slate-700'>
                                                                        <input
                                                                            type='checkbox'
                                                                            defaultChecked={
                                                                                false
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateLicenseField(
                                                                                    r.id,
                                                                                    0,
                                                                                    'renewalNotice',
                                                                                    e
                                                                                        .target
                                                                                        .checked,
                                                                                )
                                                                            }
                                                                        />
                                                                        <span>
                                                                            Notify
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                                {(
                                                                    r.licenses ||
                                                                    []
                                                                ).some(
                                                                    (l) =>
                                                                        !!l.renewalNotice,
                                                                ) && (
                                                                    <div className='px-2 py-2'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateLicenseField(
                                                                                    r.id,
                                                                                    0,
                                                                                    'noticeDays',
                                                                                    parseInt(
                                                                                        v ||
                                                                                            '0',
                                                                                        10,
                                                                                    ),
                                                                                )
                                                                            }
                                                                            placeholder='Days'
                                                                            className='w-full'
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className='px-2 py-2'>
                                                                <button
                                                                    className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                    onClick={() => {
                                                                        setLocalRows(
                                                                            (
                                                                                prev,
                                                                            ) =>
                                                                                prev.map(
                                                                                    (
                                                                                        row,
                                                                                    ) => {
                                                                                        if (
                                                                                            row.id !==
                                                                                            r.id
                                                                                        )
                                                                                            return row;
                                                                                        const list =
                                                                                            [
                                                                                                ...(((
                                                                                                    row as any
                                                                                                )
                                                                                                    .licenses as any[]) ||
                                                                                                    []),
                                                                                            ];
                                                                                        list.push(
                                                                                            {
                                                                                                enterprise:
                                                                                                    '',
                                                                                                product:
                                                                                                    '',
                                                                                                service:
                                                                                                    '',
                                                                                                licenseStart:
                                                                                                    '',
                                                                                                licenseEnd:
                                                                                                    '',
                                                                                                users: 0,
                                                                                                renewalNotice:
                                                                                                    false,
                                                                                                noticeDays: 0,
                                                                                            } as any,
                                                                                        );
                                                                                        return {
                                                                                            ...(row as any),
                                                                                            licenses:
                                                                                                list,
                                                                                        } as AccountRow;
                                                                                    },
                                                                                ),
                                                                        );
                                                                    }}
                                                                >
                                                                    + Add
                                                                    license row
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {idx === displayItems.length - 1 &&
                                        onQuickAddRow && (
                                            <motion.div
                                                key={'quick-add-row'}
                                                initial={{opacity: 0}}
                                                animate={{opacity: 1}}
                                                whileHover={{scale: 1.002}}
                                                className='w-full grid items-center gap-0 rounded-md border border-dashed border-slate-300 bg-slate-50/40 hover:bg-slate-100/70 cursor-pointer'
                                                style={{
                                                    gridTemplateColumns:
                                                        gridTemplate
                                                            .split('_')
                                                            .join(' '),
                                                }}
                                                onClick={onQuickAddRow}
                                                title='Add new row'
                                            >
                                                <div className='col-span-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-500 border-t border-dashed border-slate-300'>
                                                    <Plus className='w-3.5 h-3.5' />
                                                    <span>Add new row</span>
                                                </div>
                                            </motion.div>
                                        )}
                                </>
                            ))}
                        </Reorder.Group>
                    ) : (
                        <div className='space-y-2 w-max'>
                            {Object.entries(
                                orderedItems.reduce(
                                    (acc: Record<string, AccountRow[]>, it) => {
                                        const key = String(
                                            (it as any)[groupBy] ||
                                                'Unassigned',
                                        );
                                        acc[key] = acc[key] || [];
                                        acc[key].push(it);
                                        return acc;
                                    },
                                    {},
                                ),
                            ).map(([grp, list]) => (
                                <div
                                    key={grp}
                                    className='rounded-lg border border-slate-100'
                                >
                                    <div className='px-2 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border-b'>
                                        {grp} • {list.length}
                                    </div>
                                    <Reorder.Group
                                        axis='y'
                                        values={list.map((i) => i.id)}
                                        onReorder={(ids) =>
                                            setOrder(ids as string[])
                                        }
                                        className='space-y-0 divide-y divide-slate-200'
                                        transition={{
                                            layout: {
                                                duration: 0.22,
                                                ease: [0.22, 1, 0.36, 1],
                                            },
                                            type: 'spring',
                                            stiffness: 420,
                                            damping: 28,
                                            mass: 0.65,
                                        }}
                                        layoutScroll
                                        layout
                                    >
                                        {list.map((r, idx) => (
                                            <>
                                                <SortableAccountRow
                                                    key={r.id}
                                                    row={r}
                                                    index={idx}
                                                    cols={cols}
                                                    gridTemplate={gridTemplate}
                                                    highlightQuery={
                                                        highlightQuery
                                                    }
                                                    onEdit={onEdit}
                                                    onDelete={onDelete}
                                                    onQuickAddRow={
                                                        onQuickAddRow
                                                    }
                                                    customColumns={
                                                        customColumns
                                                    }
                                                    isExpanded={expandedRows.has(
                                                        r.id,
                                                    )}
                                                    onToggle={toggleExpanded}
                                                    expandedContent={null}
                                                    onUpdateField={
                                                        updateRowField
                                                    }
                                                    isSelected={
                                                        selectedRowId === r.id
                                                    }
                                                    onSelect={(id) =>
                                                        setSelectedRowId(id)
                                                    }
                                                    onStartFill={() => {}}
                                                    inFillRange={false}
                                                />
                                                {expandedRows.has(r.id) && (
                                                    <div
                                                        className='grid bg-white'
                                                        style={{
                                                            gridTemplateColumns:
                                                                gridTemplate
                                                                    .split('_')
                                                                    .join(' '),
                                                        }}
                                                    >
                                                        {(
                                                            subItems[r.id] || [
                                                                '',
                                                                '',
                                                            ]
                                                        ).map((_, i) => (
                                                            <>
                                                                <div className='relative h-full py-2'>
                                                                    <div className='absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-slate-400'></div>
                                                                    <div className='absolute left-1/2 -translate-x-1/2 top-0 w-3 h-px bg-slate-400'></div>
                                                                </div>
                                                                {cols.map(
                                                                    (c, ci) => (
                                                                        <div
                                                                            key={`sub-${r.id}-${i}-${c}`}
                                                                            className='py-2 px-2 bg-white border-t border-slate-200'
                                                                        >
                                                                            {ci ===
                                                                            0 ? (
                                                                                <input
                                                                                    value={
                                                                                        (subItems[
                                                                                            r
                                                                                                .id
                                                                                        ] || [
                                                                                            '',
                                                                                            '',
                                                                                        ])[
                                                                                            i
                                                                                        ] ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        setSubItems(
                                                                                            (
                                                                                                m,
                                                                                            ) => {
                                                                                                const arr =
                                                                                                    [
                                                                                                        ...(m[
                                                                                                            r
                                                                                                                .id
                                                                                                        ] || [
                                                                                                            '',
                                                                                                            '',
                                                                                                        ]),
                                                                                                    ];
                                                                                                arr[
                                                                                                    i
                                                                                                ] =
                                                                                                    e.target.value;
                                                                                                return {
                                                                                                    ...m,
                                                                                                    [r.id]:
                                                                                                        arr,
                                                                                                };
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    onKeyDown={(
                                                                                        e,
                                                                                    ) => {
                                                                                        if (
                                                                                            e.key ===
                                                                                            'Enter'
                                                                                        ) {
                                                                                            setSubItems(
                                                                                                (
                                                                                                    m,
                                                                                                ) => ({
                                                                                                    ...m,
                                                                                                    [r.id]:
                                                                                                        [
                                                                                                            ...(m[
                                                                                                                r
                                                                                                                    .id
                                                                                                            ] || [
                                                                                                                '',
                                                                                                                '',
                                                                                                            ]),
                                                                                                            '',
                                                                                                        ],
                                                                                                }),
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    placeholder='+ Add subitem'
                                                                                    className='w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200'
                                                                                />
                                                                            ) : (
                                                                                <div className='text-slate-400 text-sm'></div>
                                                                            )}
                                                                        </div>
                                                                    ),
                                                                )}
                                                                {customColumns.map(
                                                                    (_, ci) => (
                                                                        <div
                                                                            key={`subc-${r.id}-${i}-${ci}`}
                                                                            className='py-2 px-3 bg-white border-t border-slate-200 text-slate-400'
                                                                        ></div>
                                                                    ),
                                                                )}
                                                                <div className='flex items-center justify-center border-t border-slate-200'>
                                                                    {i ===
                                                                    (
                                                                        subItems[
                                                                            r.id
                                                                        ] || [
                                                                            '',
                                                                            '',
                                                                        ]
                                                                    ).length -
                                                                        1 ? (
                                                                        <button
                                                                            className='h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                                            title='Add subitem'
                                                                            onClick={() =>
                                                                                setSubItems(
                                                                                    (
                                                                                        m,
                                                                                    ) => ({
                                                                                        ...m,
                                                                                        [r.id]:
                                                                                            [
                                                                                                ...(m[
                                                                                                    r
                                                                                                        .id
                                                                                                ] || [
                                                                                                    '',
                                                                                                    '',
                                                                                                ]),
                                                                                                '',
                                                                                            ],
                                                                                    }),
                                                                                )
                                                                            }
                                                                        >
                                                                            +
                                                                        </button>
                                                                    ) : (
                                                                        <div />
                                                                    )}
                                                                </div>
                                                            </>
                                                        ))}
                                                    </div>
                                                )}
                                                {idx === list.length - 1 &&
                                                    onQuickAddRow && (
                                                        <motion.div
                                                            key={`quick-add-${grp}`}
                                                            initial={{
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                            }}
                                                            whileHover={{
                                                                scale: 1.002,
                                                            }}
                                                            className='w-full grid items-center gap-0 rounded-md border border-dashed border-slate-300 bg-slate-50/40 hover:bg-slate-100/70 cursor-pointer'
                                                            style={{
                                                                gridTemplateColumns:
                                                                    gridTemplate
                                                                        .split(
                                                                            '_',
                                                                        )
                                                                        .join(
                                                                            ' ',
                                                                        ),
                                                            }}
                                                            onClick={
                                                                onQuickAddRow
                                                            }
                                                            title='Add new row'
                                                        >
                                                            <div className='col-span-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-500 border-t border-dashed border-slate-300'>
                                                                <Plus className='w-3.5 h-3.5' />
                                                                <span>
                                                                    Add new row
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                            </>
                                        ))}
                                    </Reorder.Group>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {contactModalPortal}
        </div>
    );
}

function DropdownWithCreate({
    value,
    placeholder,
    fetchUrl,
    labelKey,
    onChange,
}: {
    value: string;
    placeholder: string;
    fetchUrl: string;
    labelKey: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [items, setItems] = React.useState<
        Array<{id?: string; name: string}>
    >([]);
    const [adding, setAdding] = React.useState(false);
    const [newVal, setNewVal] = React.useState('');
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        (async () => {
            try {
                const data = await api.get<any[]>(fetchUrl);
                setItems(
                    (data || []).map((d) => ({id: d.id, name: d[labelKey]})),
                );
            } catch {}
        })();
    }, [fetchUrl, labelKey]);
    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);
    const selected = value || '';
    return (
        <div className='relative' ref={ref}>
            <button
                type='button'
                className='w-full text-left px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[12px] flex items-center justify-between'
                onClick={() => setOpen((v) => !v)}
                title={placeholder}
            >
                <span
                    className={selected ? 'text-slate-800' : 'text-slate-400'}
                >
                    {selected || placeholder}
                </span>
                <span className='ml-2 text-slate-400'>▾</span>
            </button>
            {open && (
                <div className='absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg'>
                    <div className='max-h-48 overflow-auto py-1 text-[12px]'>
                        {items.map((it) => (
                            <button
                                key={it.id || it.name}
                                className='block w-full text-left px-3 py-1.5 hover:bg-slate-50'
                                onClick={() => {
                                    onChange(it.name);
                                    setOpen(false);
                                }}
                            >
                                {it.name}
                            </button>
                        ))}
                    </div>
                    <div className='border-t p-2'>
                        {!adding ? (
                            <button
                                className='text-[12px] text-slate-600 hover:text-slate-800'
                                onClick={() => setAdding(true)}
                            >
                                + Add new
                            </button>
                        ) : (
                            <div className='flex items-center gap-2'>
                                <input
                                    value={newVal}
                                    onChange={(e) => setNewVal(e.target.value)}
                                    className='flex-1 px-2 py-1 text-[12px] rounded border border-slate-300'
                                    placeholder={`New ${placeholder.toLowerCase()}`}
                                />
                                <button
                                    className='px-2 py-1 text-[12px] rounded bg-sky-600 text-white hover:bg-sky-700'
                                    onClick={() => {
                                        if (!newVal.trim()) return;
                                        const name = newVal.trim();
                                        setItems((prev) => [...prev, {name}]);
                                        onChange(name);
                                        setNewVal('');
                                        setAdding(false);
                                        setOpen(false);
                                    }}
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
