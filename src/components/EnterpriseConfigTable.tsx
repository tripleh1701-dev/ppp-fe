'use client';

import React from 'react';
import {motion, AnimatePresence, useDragControls} from 'framer-motion';
import {api} from '@/utils/api';
import {Trash2, Pin, PinOff} from 'lucide-react';
import {createPortal} from 'react-dom';
import {useMotionValue, useTransform, animate} from 'framer-motion';
import ConfirmModal from '@/components/ConfirmModal';

export interface EnterpriseConfigRow {
    id: string;
    enterpriseName: string;
    productName: string;
    services: string[]; // service names (array)
    enterpriseId?: string; // UUID string
    productId?: string; // UUID string
    serviceIds?: string[]; // Array of UUID strings
}

interface Props {
    title?: string;
    rows: EnterpriseConfigRow[];
    onEdit: (row: EnterpriseConfigRow) => void;
    onView: (row: EnterpriseConfigRow) => void;
    onDelete: (row: EnterpriseConfigRow) => void;
    onDeleteImmediate?: (row: EnterpriseConfigRow) => void;
    onQuickAddRow?: () => void;
    onCreated?: () => void;
    visibleColumns?: Array<
        'enterpriseName' | 'productName' | 'services' | 'actions'
    >;
    externalAddKey?: number;
}

export default function EnterpriseConfigTable({
    title = 'Enterprise Configuration',
    rows,
    onEdit,
    onView,
    onDelete,
    onDeleteImmediate,
    onQuickAddRow,
    onCreated,
    visibleColumns,
    externalAddKey,
}: Props) {
    const columnOrder: Array<'enterpriseName' | 'productName' | 'services'> = [
        'enterpriseName',
        'productName',
        'services',
    ];
    const cols = React.useMemo(() => {
        const base = columnOrder;
        if (!visibleColumns || visibleColumns.length === 0) return base;
        const allowed = new Set(visibleColumns);
        return base.filter((c) => allowed.has(c));
    }, [visibleColumns]);
    const colSizes: Record<string, string> = {
        enterpriseName: '1fr',
        productName: '1fr',
        services: '1fr',
    };
    const gridTemplate = cols.map((c) => colSizes[c]).join(' ');
    const cssTemplate = gridTemplate;
    const labelFor: Record<string, string> = {
        enterpriseName: 'Enterprise',
        productName: 'Product',
        services: 'Services',
    };

    // Small, local, reusable UI pieces to reduce duplication
    const ServiceChip = ({
        text,
        onRemove,
    }: {
        text: string;
        onRemove?: () => void;
    }) => (
        <span
            className='inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-sky-50 text-sky-700 border border-sky-200'
            style={{borderRadius: '0px !important'}}
        >
            {text}
            {onRemove && (
                <button
                    className='ml-1 text-sky-700/70 hover:text-sky-900'
                    onClick={onRemove}
                    title='Remove'
                >
                    ×
                </button>
            )}
        </span>
    );

    const AddMoreButton = ({onClick}: {onClick: () => void}) => (
        <button
            className='shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50'
            title='Add more service'
            onClick={onClick}
        >
            +
        </button>
    );

    const [serviceOptions, setServiceOptions] = React.useState<string[]>([]);

    // Load services from enterprise-specific API (separate from User Groups)
    React.useEffect(() => {
        const loadServices = async () => {
            try {
                const services = await api.get<
                    Array<{id: string; name: string}>
                >('/api/services');
                setServiceOptions(services?.map((s) => s.name) || []);
                console.log(
                    '✅ Loaded enterprise services:',
                    services?.length || 0,
                );
            } catch (error) {
                console.error('Failed to load enterprise services:', error);
                setServiceOptions([]);
            }
        };
        loadServices();
    }, []);

    type DraftRow = {
        key: string;
        entName: string;
        productName: string;
        services: string[];
    };
    const [addingRows, setAddingRows] = React.useState<DraftRow[]>([]);
    const addBlankRow = React.useCallback(() => {
        setAddingRows((prev) => [
            ...prev,
            {
                key: `draft-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,
                entName: '',
                productName: '',
                services: [],
            },
        ]);
    }, []);
    const saveTimersRef = React.useRef<Record<string, any>>({});
    const savingKeysRef = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        (async () => {
            try {
                const list = await api.get<{id: string; name: string}[]>(
                    '/api/services',
                );
                setServiceOptions((list || []).map((o) => o.name));
            } catch {}
        })();
    }, []);

    // no-op placeholder intentionally removed; services handled per-row

    const saveDraft = async (draftKey: string) => {
        const draft = addingRows.find((d) => d.key === draftKey);
        if (!draft) return;
        const name = draft.entName.trim();
        const prod = draft.productName.trim();
        if (!name || !prod) return;
        try {
            if (savingKeysRef.current.has(draftKey)) return;
            savingKeysRef.current.add(draftKey);

            console.log(
                'Creating new enterprise product service relationship:',
                {
                    enterprise_name: name,
                    product_name: prod,
                    services: draft.services,
                },
            );

            // First, ensure enterprise exists (check first, then create if needed)
            let enterpriseId: string;
            const enterprises = await api.get<
                Array<{id: string; name: string}>
            >('/api/enterprises');
            const existingEnterprise = enterprises.find(
                (e) => e.name.toLowerCase() === name.toLowerCase(),
            );
            if (existingEnterprise) {
                enterpriseId = existingEnterprise.id;
            } else {
                try {
                    const enterpriseResponse = await api.post<{id: string}>(
                        '/api/enterprises',
                        {
                            name: name,
                            services: [],
                        },
                    );
                    enterpriseId = enterpriseResponse.id;
                } catch (error) {
                    throw new Error('Failed to create enterprise');
                }
            }

            // Ensure product exists (check first, then create if needed)
            let productId: string;
            const products = await api.get<Array<{id: string; name: string}>>(
                '/api/products',
            );
            const existingProduct = products.find(
                (p) => p.name.toLowerCase() === prod.toLowerCase(),
            );
            if (existingProduct) {
                productId = existingProduct.id;
            } else {
                try {
                    const productResponse = await api.post<{id: string}>(
                        '/api/products',
                        {
                            name: prod,
                        },
                    );
                    productId = productResponse.id;
                } catch (error) {
                    throw new Error('Failed to create product');
                }
            }

            // Try to create relationships in enterprise_products_services table first
            try {
                // Collect all service IDs first
                const serviceIds: number[] = [];

                for (const serviceName of draft.services) {
                    let serviceId: number;
                    const services = await api.get<
                        Array<{id: number; name: string}>
                    >('/api/services');
                    const existingService = services.find(
                        (s) =>
                            s.name.toLowerCase() === serviceName.toLowerCase(),
                    );
                    if (existingService) {
                        serviceId = existingService.id;
                    } else {
                        try {
                            const serviceResponse = await api.post<{
                                id: number;
                            }>('/api/services', {
                                name: serviceName,
                            });
                            serviceId = serviceResponse.id;
                        } catch (error) {
                            throw new Error(
                                `Failed to create service: ${serviceName}`,
                            );
                        }
                    }
                    serviceIds.push(serviceId);
                }

                // Create or update single row with array of service IDs
                await api.post('/api/enterprise-products-services', {
                    enterpriseId: parseInt(enterpriseId),
                    productId: parseInt(productId),
                    serviceId: serviceIds, // Send array as 'service_id' (singular, matching DB column)
                });
                console.log(
                    'Enterprise product service relationship created successfully in new table',
                );
            } catch (error) {
                console.warn(
                    'New enterprise_products_services table not available, falling back to legacy structure:',
                    error,
                );

                // Fallback: Update enterprise with the new product and services
                try {
                    const existingEnterprise = await api.get<{
                        id: string;
                        name: string;
                        services: any[];
                    }>(`/api/enterprises/${enterpriseId}`);
                    const updatedServices = [
                        ...(existingEnterprise.services || []),
                        {
                            id: productId,
                            name: prod,
                            categories: draft.services,
                        },
                    ];

                    await api.put(`/api/enterprises/${enterpriseId}`, {
                        name: name,
                        services: updatedServices,
                    });
                    console.log(
                        'Enterprise updated with new product and services using legacy structure',
                    );
                } catch (fallbackError) {
                    console.error(
                        'Failed to update enterprise with fallback method:',
                        fallbackError,
                    );
                    throw fallbackError;
                }
            }

            // Keep the row after auto-save - don't remove it
            console.log(
                '✅ Auto-save successful - keeping row for further editing',
            );
            onCreated && onCreated();
        } catch (error) {
            console.error(
                'Failed to create enterprise product service relationship:',
                error,
            );
        } finally {
            savingKeysRef.current.delete(draftKey);
            const t = saveTimersRef.current[draftKey];
            if (t) {
                clearTimeout(t);
                delete saveTimersRef.current[draftKey];
            }
        }
    };

    const [pinnedFirst, setPinnedFirst] = React.useState(true);
    React.useEffect(() => {
        if (externalAddKey !== undefined) {
            addBlankRow();
        }
    }, [externalAddKey]);

    // Debounced save for collecting all service changes before API call
    const draftSaveTimers = React.useRef<Record<string, NodeJS.Timeout>>({});
    const debouncedSaveDraft = React.useCallback((draftKey: string) => {
        // Clear existing timer for this draft
        if (draftSaveTimers.current[draftKey]) {
            clearTimeout(draftSaveTimers.current[draftKey]);
        }

        // Set new timer to save after 500ms of inactivity
        draftSaveTimers.current[draftKey] = setTimeout(() => {
            console.log('⏰ Debounced save triggered for:', draftKey);
            saveDraft(draftKey);
            delete draftSaveTimers.current[draftKey];
        }, 500);
    }, []);

    // Autosave drafts when both Enterprise and Product are filled; debounce
    React.useEffect(() => {
        for (const d of addingRows) {
            const ready =
                d.entName.trim().length > 0 && d.productName.trim().length > 0;
            const key = d.key;
            const existing = saveTimersRef.current[key];
            if (ready) {
                if (existing) continue; // timer already scheduled
                saveTimersRef.current[key] = setTimeout(() => {
                    void saveDraft(key);
                }, 600);
            } else if (existing) {
                clearTimeout(existing);
                delete saveTimersRef.current[key];
            }
        }
        // Cleanup timers for removed drafts
        Object.keys(saveTimersRef.current).forEach((k) => {
            if (!addingRows.some((d) => d.key === k)) {
                clearTimeout(saveTimersRef.current[k]);
                delete saveTimersRef.current[k];
            }
        });
    }, [addingRows]);
    const [rowValues, setRowValues] = React.useState<
        Record<
            string,
            {
                enterpriseName: string;
                productName: string; // legacy single value (kept for compatibility)
                products?: string[]; // NEW multi-select for products
                services: string[];
            }
        >
    >({});
    const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());
    const [confirmRow, setConfirmRow] =
        React.useState<EnterpriseConfigRow | null>(null);
    const [svcOpenSignals, setSvcOpenSignals] = React.useState<
        Record<string, number>
    >({});
    const [draftSvcOpenSignals, setDraftSvcOpenSignals] = React.useState<
        Record<string, number>
    >({});
    // Removed enterprise-level debounced autosave to avoid overwriting UI state
    // Map rowId -> enterpriseId for quick aggregation
    const rowIdToEnterpriseIdRef = React.useRef<Record<string, string>>({});
    React.useEffect(() => {
        const map: Record<string, string> = {};
        for (const r of rows) {
            const idText = String(r.id ?? '');
            const enterpriseId = idText.includes('-')
                ? idText.split('-')[0]
                : idText;
            map[idText] = enterpriseId;
        }
        rowIdToEnterpriseIdRef.current = map;
    }, [rows.map((r) => r.id).join(',')]);

    // Debounced autosave for existing rows (not drafts)
    const saveTimersByEnterprise = React.useRef<Record<string, any>>({});
    const scheduleSaveForEnterprise = React.useCallback(
        (enterpriseId: string) => {
            console.log(
                '🚀 scheduleSaveForEnterprise called for enterprise:',
                enterpriseId,
            );
            const timers = saveTimersByEnterprise.current;
            if (timers[enterpriseId]) clearTimeout(timers[enterpriseId]);
            timers[enterpriseId] = setTimeout(async () => {
                console.log(
                    '⏰ Auto-save timer triggered for enterprise:',
                    enterpriseId,
                );
                try {
                    // Aggregate current values for this enterprise
                    const allRowIds = Object.keys(
                        rowIdToEnterpriseIdRef.current,
                    ).filter(
                        (rid) =>
                            rowIdToEnterpriseIdRef.current[rid] ===
                            enterpriseId,
                    );
                    if (allRowIds.length === 0) return;

                    // Build relationships for enterprise_products_services table
                    for (const rid of allRowIds) {
                        const v = rowValues[rid];
                        // Fallback to incoming prop if user hasn't touched this row yet
                        const propRow = rows.find((r) => r.id === rid);
                        const entName =
                            v?.enterpriseName ?? propRow?.enterpriseName ?? '';
                        const prodName = (
                            v?.productName ??
                            propRow?.productName ??
                            ''
                        ).trim();
                        const services = (
                            v?.services ??
                            propRow?.services ??
                            []
                        ).filter(Boolean);

                        if (!entName.trim() || !prodName || prodName === '—')
                            continue;

                        // Ensure enterprise exists (check first, then create if needed)
                        let enterpriseId: string;
                        const enterprises = await api.get<
                            Array<{id: string; name: string}>
                        >('/api/enterprises');
                        const existingEnterprise = enterprises.find(
                            (e) =>
                                e.name.toLowerCase() === entName.toLowerCase(),
                        );
                        if (existingEnterprise) {
                            enterpriseId = existingEnterprise.id;
                        } else {
                            try {
                                const enterpriseResponse = await api.post<{
                                    id: string;
                                }>('/api/enterprises', {
                                    name: entName.trim(),
                                    services: [],
                                });
                                enterpriseId = enterpriseResponse.id;
                            } catch (error) {
                                console.error(
                                    'Failed to create enterprise:',
                                    entName,
                                );
                                continue;
                            }
                        }

                        // Ensure product exists (check first, then create if needed)
                        let productId: string;
                        const products = await api.get<
                            Array<{id: string; name: string}>
                        >('/api/products');
                        const existingProduct = products.find(
                            (p) =>
                                p.name.toLowerCase() === prodName.toLowerCase(),
                        );
                        if (existingProduct) {
                            productId = existingProduct.id;
                        } else {
                            try {
                                const productResponse = await api.post<{
                                    id: string;
                                }>('/api/products', {
                                    name: prodName,
                                });
                                productId = productResponse.id;
                            } catch (error) {
                                console.error(
                                    'Failed to create product:',
                                    prodName,
                                );
                                continue;
                            }
                        }

                        // Try to use the new enterprise_products_services table first
                        try {
                            // Collect all service IDs for this enterprise+product combination
                            const serviceIds: number[] = [];

                            for (const serviceName of services) {
                                let serviceId: number;
                                const servicesList = await api.get<
                                    Array<{id: number; name: string}>
                                >('/api/services');
                                const existingService = servicesList.find(
                                    (s) =>
                                        s.name.toLowerCase() ===
                                        serviceName.toLowerCase(),
                                );
                                if (existingService) {
                                    serviceId = existingService.id;
                                } else {
                                    try {
                                        const serviceResponse = await api.post<{
                                            id: number;
                                        }>('/api/services', {
                                            name: serviceName,
                                        });
                                        serviceId = serviceResponse.id;
                                    } catch (error) {
                                        console.error(
                                            'Failed to create service:',
                                            serviceName,
                                        );
                                        continue;
                                    }
                                }
                                serviceIds.push(serviceId);
                            }

                            // Create or update single row with array of service IDs
                            console.log(
                                '💾 Saving to enterprise-products-services:',
                                {
                                    enterpriseId: parseInt(enterpriseId),
                                    productId: parseInt(productId),
                                    serviceId: serviceIds,
                                },
                            );
                            await api.post(
                                '/api/enterprise-products-services',
                                {
                                    enterpriseId: parseInt(enterpriseId),
                                    productId: parseInt(productId),
                                    serviceId: serviceIds, // Send array as 'service_id' (singular, matching DB column)
                                },
                            );
                            console.log(
                                '✅ Successfully saved enterprise-products-services for:',
                                entName,
                                prodName,
                            );
                        } catch (error) {
                            console.warn(
                                'New enterprise_products_services table not available, falling back to legacy structure:',
                                error,
                            );

                            // Fallback: Update enterprise with the new product and services
                            try {
                                const existingEnterprise = await api.get<{
                                    id: string;
                                    name: string;
                                    services: any[];
                                }>(`/api/enterprises/${enterpriseId}`);

                                // Remove existing product if it exists
                                const filteredServices = (
                                    existingEnterprise.services || []
                                ).filter((s) => s.name !== prodName);

                                // Add new product with services
                                const updatedServices = [
                                    ...filteredServices,
                                    {
                                        id: productId,
                                        name: prodName,
                                        categories: services,
                                    },
                                ];

                                await api.put(
                                    `/api/enterprises/${enterpriseId}`,
                                    {
                                        name: entName.trim(),
                                        services: updatedServices,
                                    },
                                );
                                console.log(
                                    'Enterprise updated with new product and services using legacy structure',
                                );
                            } catch (fallbackError) {
                                console.error(
                                    'Failed to update enterprise with fallback method:',
                                    fallbackError,
                                );
                            }
                        }
                    }

                    console.log('Enterprise relationships saved successfully', {
                        enterpriseId,
                        rowValues,
                    });
                    // Add a more visible log to confirm when data is saved
                    console.log(
                        '%c Enterprise data saved! ',
                        'background: #4CAF50; color: white; font-weight: bold;',
                    );
                    onCreated && onCreated();
                } catch (error) {
                    console.error(
                        'Failed to save enterprise relationships:',
                        enterpriseId,
                        error,
                    );
                }
            }, 300); // Reduced debounce time for faster saving
        },
        [rowValues, rows, onCreated],
    );

    // Removed problematic useEffect that was causing infinite re-renders
    // Auto-save is now handled directly in the onChange handlers

    React.useEffect(() => {
        setRowValues((prev) => {
            const next: Record<
                string,
                {
                    enterpriseName: string;
                    productName: string;
                    products?: string[];
                    services: string[];
                }
            > = {...prev};
            const validIds = new Set<string>();
            for (const r of rows) {
                validIds.add(r.id);
                if (!next[r.id]) {
                    next[r.id] = {
                        enterpriseName: r.enterpriseName,
                        productName: r.productName,
                        products:
                            r.productName && r.productName !== '—'
                                ? [r.productName]
                                : [],
                        services: Array.isArray(r.services) ? r.services : [],
                    };
                }
            }
            // prune rows that no longer exist
            for (const k of Object.keys(next)) {
                if (!validIds.has(k)) delete next[k];
            }
            return next;
        });
    }, [rows.map((r) => r.id).join(',')]);

    function SwipeRow({
        rowId,
        idx,
        onSwiped,
        children,
        draggable,
        onDragStart,
    }: {
        rowId: string;
        idx: number;
        onSwiped: () => void;
        children: React.ReactNode;
        draggable?: boolean;
        onDragStart?: React.DragEventHandler<HTMLDivElement>;
    }) {
        // Swipe-to-delete deprecated; using drag-to-trash only
        return (
            <div
                className={`relative select-none w-full grid items-center gap-0 rounded-md overflow-visible border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                }`}
                style={{gridTemplateColumns: cssTemplate}}
                draggable={draggable}
                onDragStart={onDragStart}
            >
                {children}
            </div>
        );
    }

    function ECAsyncChipSelect({
        type,
        value,
        onChange,
        placeholder,
    }: {
        type: 'enterprise' | 'product';
        value?: string;
        onChange: (next?: string) => void;
        placeholder: string;
    }) {
        const [open, setOpen] = React.useState(false);
        const [current, setCurrent] = React.useState<string | undefined>(value);
        const [query, setQuery] = React.useState('');
        const [options, setOptions] = React.useState<
            {id: string; name: string}[]
        >([]);
        const [loading, setLoading] = React.useState(false);
        const [addingLocal, setAddingLocal] = React.useState('');
        const [showAdder, setShowAdder] = React.useState(false);
        const containerRef = React.useRef<HTMLDivElement>(null);
        const dropdownRef = React.useRef<HTMLDivElement>(null);
        const [dropdownPos, setDropdownPos] = React.useState<{
            top: number;
            left: number;
            width: number;
        } | null>(null);
        const [limit, setLimit] = React.useState(20);
        const [ActiveIndex, setActiveIndex] = React.useState<number>(-1);
        const inputRef = React.useRef<HTMLInputElement>(null);

        const loadOptions = React.useCallback(async () => {
            setLoading(true);
            try {
                if (type === 'product') {
                    console.log('Loading products from API...');
                    const data = await api.get<
                        Array<{id: string; name: string}>
                    >(
                        `/api/products${
                            query ? `?search=${encodeURIComponent(query)}` : ''
                        }`,
                    );
                    console.log('Products loaded:', data);
                    setOptions(data || []);
                } else {
                    console.log('Loading enterprises from API...');
                    const ents = await api.get<
                        Array<{id: string; name: string}>
                    >('/api/enterprises');
                    console.log('Enterprises loaded:', ents);
                    const filtered = (ents || []).filter((e) =>
                        query
                            ? e.name.toLowerCase().includes(query.toLowerCase())
                            : true,
                    );
                    setOptions(filtered);
                }
            } catch (error) {
                console.error(`Failed to load ${type}s:`, error);
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
                const width = 200; // extra compact width
                const left = Math.max(
                    8,
                    Math.min(window.innerWidth - width - 8, rect.left),
                );
                const top = Math.min(window.innerHeight - 16, rect.bottom + 8);
                setDropdownPos({top, left, width});
            }
            setLimit(20);
            setTimeout(() => inputRef.current?.focus(), 0);
        }, [open, loadOptions]);

        React.useEffect(() => {
            const onDoc = (e: MouseEvent) => {
                const target = e.target as Node;
                const withinAnchor = !!containerRef.current?.contains(target);
                const withinDropdown = !!dropdownRef.current?.contains(target);
                if (!withinAnchor && !withinDropdown) {
                    setOpen(false);
                    setShowAdder(false);
                    setAddingLocal('');
                }
            };
            document.addEventListener('click', onDoc, true);
            return () => document.removeEventListener('click', onDoc, true);
        }, []);

        const addNew = async () => {
            const name = (addingLocal || query || '').trim();
            if (!name) return;
            try {
                let created: {id: string; name: string} | null = null;
                if (type === 'product') {
                    created = await api.post<{id: string; name: string}>(
                        '/api/products',
                        {name},
                    );
                    // product options list removed (unused)
                } else {
                    created = await api.post<{id: string; name: string}>(
                        '/api/enterprises',
                        {name, services: []},
                    );
                    // enterprise options list removed (unused)
                }
                if (created) {
                    setOptions((prev) => {
                        const exists = prev.some((o) => o.id === created!.id);
                        return exists ? prev : [...prev, created!];
                    });
                    setShowAdder(false);
                    setAddingLocal('');
                    setQuery('');
                }
            } catch {}
        };

        React.useEffect(() => {
            setCurrent(value);
        }, [value]);

        const filtered = React.useMemo(
            () =>
                options.filter((opt) =>
                    query
                        ? opt.name.toLowerCase().includes(query.toLowerCase())
                        : true,
                ),
            [options, query],
        );

        return (
            <div ref={containerRef} className='relative min-w-0'>
                {current ? (
                    <button
                        onClick={() => setOpen(true)}
                        className='inline-flex max-w-full items-center gap-1 px-2 py-0.5 text-[11px] text-white border border-transparent'
                        title={current}
                        style={{
                            borderRadius: '0px !important',
                            backgroundColor: [
                                '#ec4899',
                                '#06b6d4',
                                '#10b981',
                                '#8b5cf6',
                                '#f59e0b',
                                '#ef4444',
                            ][
                                Math.abs(
                                    Array.from(current).reduce(
                                        (h, c) =>
                                            (h * 31 + c.charCodeAt(0)) >>> 0,
                                        0,
                                    ),
                                ) % 6
                            ],
                        }}
                    >
                        <span className='truncate'>{current}</span>
                    </button>
                ) : (
                    <button
                        onClick={() => setOpen(true)}
                        className='w-full text-left px-3 py-1.5 text-[12px] rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
                    >
                        {placeholder}
                    </button>
                )}
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
                            role='listbox'
                            aria-label={`${type} options`}
                        >
                            <div className='absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200'></div>
                            <div className='p-2 border-b border-slate-200'>
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setLimit(20);
                                        setActiveIndex(-1);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setActiveIndex((i) =>
                                                Math.min(
                                                    i + 1,
                                                    Math.min(
                                                        filtered.length,
                                                        limit,
                                                    ) - 1,
                                                ),
                                            );
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setActiveIndex((i) =>
                                                Math.max(i - 1, 0),
                                            );
                                        } else if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const list = filtered.slice(
                                                0,
                                                limit,
                                            );
                                            const pick = list[ActiveIndex];
                                            if (pick) {
                                                setCurrent(pick.name);
                                                onChange(pick.name);
                                                setOpen(false);
                                            } else if (
                                                showAdder &&
                                                (addingLocal || query)
                                            ) {
                                                void addNew();
                                            }
                                        } else if (e.key === 'Escape') {
                                            setOpen(false);
                                        }
                                    }}
                                    placeholder={`Search ${type}s`}
                                    className='w-full rounded border border-slate-300 px-2.5 py-1 text-[12px]'
                                />
                            </div>
                            <div
                                className='max-h-60 overflow-auto p-2 space-y-1.5'
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    if (
                                        el.scrollTop + el.clientHeight >=
                                        el.scrollHeight - 12
                                    ) {
                                        setLimit((l) => l + 20);
                                    }
                                }}
                            >
                                {loading ? (
                                    <div className='px-3 py-2 text-slate-500'>
                                        Loading…
                                    </div>
                                ) : options.length === 0 ? (
                                    <div className='px-3 py-2 text-slate-500'>
                                        No matches
                                    </div>
                                ) : (
                                    filtered.slice(0, limit).map((opt, idx) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setCurrent(opt.name);
                                                onChange(opt.name);
                                                setOpen(false);
                                            }}
                                            className={`w-full rounded-md px-2.5 py-1 text-[12px] transition-colors ${
                                                ActiveIndex === idx
                                                    ? 'ring-2 ring-violet-300'
                                                    : ''
                                            } ${(() => {
                                                const palette = [
                                                    'bg-pink-500 hover:bg-pink-400 text-white',
                                                    'bg-sky-500 hover:bg-sky-400 text-white',
                                                    'bg-emerald-500 hover:bg-emerald-400 text-white',
                                                    'bg-violet-500 hover:bg-violet-400 text-white',
                                                    'bg-amber-500 hover:bg-amber-400 text-white',
                                                    'bg-rose-500 hover:bg-rose-400 text-white',
                                                ];
                                                const idx =
                                                    Math.abs(
                                                        Array.from(
                                                            opt.name,
                                                        ).reduce(
                                                            (h, c) =>
                                                                (h * 31 +
                                                                    c.charCodeAt(
                                                                        0,
                                                                    )) >>>
                                                                0,
                                                            0,
                                                        ),
                                                    ) % palette.length;
                                                return palette[idx];
                                            })()}`}
                                            onMouseEnter={() =>
                                                setActiveIndex(idx)
                                            }
                                            role='option'
                                        >
                                            {opt.name}
                                        </button>
                                    ))
                                )}
                                {!loading && options.length > limit && (
                                    <div className='text-center text-[11px] text-slate-500 py-1'>
                                        Showing
                                        {Math.min(limit, options.length)} of
                                        {options.length}
                                    </div>
                                )}
                            </div>
                            <div className='border-t border-slate-200 px-3 py-2'>
                                <button
                                    onClick={() => {
                                        setAddingLocal('');
                                        setShowAdder(true);
                                    }}
                                    className='group w-full text-left text-[12px] text-slate-700 hover:text-slate-900 flex items-center gap-2'
                                >
                                    <span className='inline-flex items-center justify-center h-5 w-5 rounded-full border border-slate-300 bg-white group-hover:bg-slate-50 transition-colors'>
                                        +
                                    </span>
                                    <span className='inline-block overflow-hidden'>
                                        <span className='inline-block transform transition-transform duration-200 -translate-x-1 group-hover:translate-x-0'>
                                            Add {type}
                                        </span>
                                        <span className='inline-block ml-0.5'>
                                            |
                                        </span>
                                    </span>
                                </button>
                                {showAdder && (
                                    <div className='mt-2'>
                                        <div className='flex items-center gap-2'>
                                            <input
                                                value={addingLocal}
                                                onChange={(e) =>
                                                    setAddingLocal(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter')
                                                        addNew();
                                                }}
                                                placeholder={`Enter ${type} name`}
                                                className='flex-1 rounded border border-slate-300 px-2 py-1 text-[12px]'
                                            />
                                            <button
                                                onClick={addNew}
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
            </div>
        );
    }

    function ECServicesDropdown({
        selected,
        onToggle,
        externalOpenKey,
        hideAnchor,
    }: {
        selected: string[];
        onToggle: (name: string) => void;
        externalOpenKey?: number;
        hideAnchor?: boolean;
    }) {
        const [open, setOpen] = React.useState(false);
        const [query, setQuery] = React.useState('');
        const [options, setOptions] = React.useState<string[]>(serviceOptions);
        const containerRef = React.useRef<HTMLDivElement>(null);
        const dropdownRef = React.useRef<HTMLDivElement>(null);
        const [pos, setPos] = React.useState<{
            top: number;
            left: number;
            width: number;
        } | null>(null);
        const [limit, setLimit] = React.useState(20);
        const [ActiveIndex, setActiveIndex] = React.useState<number>(-1);
        const inputRef = React.useRef<HTMLInputElement>(null);
        const [showAdder, setShowAdder] = React.useState(false);
        const [addingLocal, setAddingLocal] = React.useState('');
        const adderInputRef = React.useRef<HTMLInputElement>(null);
        React.useEffect(() => setOptions(serviceOptions), [serviceOptions]);
        React.useEffect(() => {
            if (!open) return;
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect)
                setPos({top: rect.bottom + 8, left: rect.left, width: 200});
            setLimit(20);
            setTimeout(() => inputRef.current?.focus(), 0);
        }, [open]);
        // programmatic open when externalOpenKey changes
        React.useEffect(() => {
            if (externalOpenKey !== undefined) {
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 0);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [externalOpenKey]);
        React.useEffect(() => {
            const onDoc = (e: MouseEvent) => {
                const t = e.target as Node;
                if (
                    !containerRef.current?.contains(t) &&
                    !dropdownRef.current?.contains(t)
                )
                    setOpen(false);
            };
            document.addEventListener('click', onDoc, true);
            return () => document.removeEventListener('click', onDoc, true);
        }, []);
        const filtered = React.useMemo(
            () =>
                options.filter((o) =>
                    query
                        ? o.toLowerCase().includes(query.toLowerCase())
                        : true,
                ),
            [options, query],
        );

        const addNewService = async () => {
            const nm = (addingLocal || query || '').trim();
            if (!nm) return;
            try {
                const created = await api.post('/api/services', {name: nm});
                if (created && !serviceOptions.includes(nm)) {
                    setServiceOptions((prev) => [...prev, nm]);
                    setOptions((prev) =>
                        prev.includes(nm) ? prev : [...prev, nm],
                    );
                }
                setShowAdder(false);
                setAddingLocal('');
                onToggle(nm);
                setTimeout(() => inputRef.current?.focus(), 0);
            } catch (error) {
                console.error('Failed to create service:', error);
            }
        };

        return (
            <div ref={containerRef} className='relative min-w-0'>
                {!hideAnchor ? (
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className='w-full text-left px-3 py-1.5 text-[12px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                    >
                        Select products
                    </button>
                ) : null}
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
                            role='listbox'
                            aria-label='product options'
                        >
                            <div className='absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200'></div>
                            <div className='p-2 border-b border-slate-200'>
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setActiveIndex((i) =>
                                                Math.min(
                                                    i + 1,
                                                    Math.min(
                                                        filtered.length,
                                                        limit,
                                                    ) - 1,
                                                ),
                                            );
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setActiveIndex((i) =>
                                                Math.max(i - 1, 0),
                                            );
                                        } else if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const list = filtered.slice(
                                                0,
                                                limit,
                                            );
                                            const pick = list[ActiveIndex];
                                            if (pick) onToggle(pick);
                                        } else if (e.key === 'Escape') {
                                            setOpen(false);
                                        }
                                    }}
                                    placeholder='Search products'
                                    className='w-full rounded border border-slate-300 px-2.5 py-1 text-[12px]'
                                />
                            </div>
                            <div
                                className='max-h-60 overflow-auto p-2 space-y-1'
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    if (
                                        el.scrollTop + el.clientHeight >=
                                        el.scrollHeight - 12
                                    ) {
                                        setLimit((l) => l + 20);
                                    }
                                }}
                            >
                                {filtered.slice(0, limit).map((opt, idx) => (
                                    <label
                                        key={opt}
                                        className={`flex items-center gap-2 px-2 py-1 text-[12px] hover:bg-slate-50 cursor-pointer rounded ${
                                            [
                                                'bg-rose-50',
                                                'bg-sky-50',
                                                'bg-emerald-50',
                                                'bg-violet-50',
                                                'bg-amber-50',
                                                'bg-indigo-50',
                                            ][idx % 6]
                                        }`}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                    >
                                        <input
                                            type='checkbox'
                                            checked={selected.includes(opt)}
                                            onChange={() => onToggle(opt)}
                                            className='h-3 w-3'
                                        />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                                {filtered.length > limit && (
                                    <div className='text-center text-[11px] text-slate-500 py-1'>
                                        Showing {limit} of {filtered.length}
                                    </div>
                                )}
                            </div>
                            <div className='border-t border-slate-200 px-3 py-2'>
                                {!showAdder ? (
                                    <button
                                        onClick={() => {
                                            setAddingLocal(query);
                                            setShowAdder(true);
                                            setTimeout(
                                                () =>
                                                    adderInputRef.current?.focus(),
                                                0,
                                            );
                                        }}
                                        className='group w-full text-left text-[12px] text-slate-700 hover:text-slate-900 flex items-center gap-2'
                                    >
                                        <span className='inline-flex items-center justify-center h-5 w-5 rounded border border-slate-300'>
                                            +
                                        </span>
                                        <span className='inline-block'>
                                            Add new service
                                        </span>
                                    </button>
                                ) : (
                                    <div className='mt-2 flex items-center gap-2'>
                                        <input
                                            ref={adderInputRef}
                                            value={addingLocal}
                                            onChange={(e) =>
                                                setAddingLocal(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    addNewService();
                                                if (e.key === 'Escape') {
                                                    setShowAdder(false);
                                                    setAddingLocal('');
                                                }
                                            }}
                                            placeholder='Enter service name'
                                            className='flex-1 rounded border border-slate-300 px-2 py-1 text-[12px]'
                                        />
                                        <button
                                            onClick={addNewService}
                                            className='inline-flex items-center gap-1 px-2 py-1 rounded bg-violet-600 text-white text-[12px] hover:bg-violet-700'
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAdder(false);
                                                setAddingLocal('');
                                            }}
                                            className='inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 text-[12px] bg-white hover:bg-slate-50'
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>,
                        document.body,
                    )}
            </div>
        );
    }

    return (
        <>
            <div className='w-full'>
                <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-sm font-semibold text-slate-800'>
                        {title}
                    </h3>
                </div>
                <div role='table' className='p-0 overflow-x-auto'>
                    <div className='w-full relative rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-white'>
                        <div
                            className='sticky top-0 z-30 grid w-full overflow-visible gap-0 px-2 py-2 text-[12px] font-semibold text-slate-800 bg-white/90 supports-[backdrop-filter]:backdrop-blur-sm border-b border-slate-200 shadow-md'
                            style={{gridTemplateColumns: cssTemplate}}
                        >
                            {cols.map((c, idx) => (
                                <div
                                    key={c}
                                    className={`relative min-w-0 flex items-center gap-1 px-2 py-2 border-r border-slate-200 ${
                                        idx === 0 && pinnedFirst
                                            ? 'sticky left-0 z-20 bg-sky-50/80 backdrop-blur-sm shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)]'
                                            : ''
                                    }`}
                                >
                                    <span>{labelFor[c]}</span>
                                    {idx === 0 && (
                                        <button
                                            className='ml-1 p-1 rounded hover:bg-slate-100 text-slate-600'
                                            onClick={() =>
                                                setPinnedFirst((v) => !v)
                                            }
                                            title={
                                                pinnedFirst
                                                    ? 'Unfreeze column'
                                                    : 'Freeze column'
                                            }
                                        >
                                            {pinnedFirst ? (
                                                <Pin className='w-3.5 h-3.5' />
                                            ) : (
                                                <PinOff className='w-3.5 h-3.5' />
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className='space-y-0 divide-y divide-slate-200'>
                            <AnimatePresence initial={false}>
                                {rows
                                    .filter((r) => !hiddenIds.has(r.id))
                                    .map((r, idx) => (
                                        <SwipeRow
                                            key={`${r.id}-${idx}`}
                                            rowId={r.id}
                                            idx={idx}
                                            onSwiped={() => {
                                                setConfirmRow(r);
                                            }}
                                            draggable
                                            onDragStart={(e) => {
                                                try {
                                                    e.dataTransfer.effectAllowed =
                                                        'move';
                                                    const payload = {
                                                        rowId: r.id,
                                                        enterpriseName:
                                                            r.enterpriseName,
                                                        productName:
                                                            r.productName,
                                                    };
                                                    e.dataTransfer.setData(
                                                        'application/json',
                                                        JSON.stringify(payload),
                                                    );
                                                } catch {}
                                            }}
                                        >
                                            {cols.includes(
                                                'enterpriseName',
                                            ) && (
                                                <div
                                                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 ${
                                                        pinnedFirst
                                                            ? 'sticky left-0 z-10 bg-inherit after:content-[" "] after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-slate-200 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)]'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className='min-w-0 w-full'>
                                                        <ECAsyncChipSelect
                                                            type='enterprise'
                                                            value={
                                                                rowValues[r.id]
                                                                    ?.enterpriseName
                                                            }
                                                            onChange={(v) =>
                                                                setRowValues(
                                                                    (prev) => {
                                                                        const newValues =
                                                                            {
                                                                                ...prev,
                                                                                [r.id]:
                                                                                    {
                                                                                        ...(prev[
                                                                                            r
                                                                                                .id
                                                                                        ] || {
                                                                                            enterpriseName:
                                                                                                '',
                                                                                            productName:
                                                                                                '',
                                                                                            services:
                                                                                                [],
                                                                                        }),
                                                                                        enterpriseName:
                                                                                            v ||
                                                                                            '',
                                                                                    },
                                                                            };

                                                                        // Immediately schedule save for this enterprise to prevent data loss
                                                                        const eid =
                                                                            rowIdToEnterpriseIdRef
                                                                                .current[
                                                                                r
                                                                                    .id
                                                                            ];
                                                                        if (
                                                                            eid
                                                                        ) {
                                                                            // Use setTimeout to ensure this runs after state update
                                                                            setTimeout(
                                                                                () =>
                                                                                    scheduleSaveForEnterprise(
                                                                                        eid,
                                                                                    ),
                                                                                0,
                                                                            );
                                                                        }

                                                                        return newValues;
                                                                    },
                                                                )
                                                            }
                                                            placeholder='Select Enterprise'
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {cols.includes('productName') && (
                                                <div className='text-slate-700 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-2'>
                                                    <ECAsyncChipSelect
                                                        type='product'
                                                        value={
                                                            rowValues[r.id]
                                                                ?.productName
                                                        }
                                                        onChange={(v) => {
                                                            setRowValues(
                                                                (prev) => {
                                                                    const newValues =
                                                                        {
                                                                            ...prev,
                                                                            [r.id]:
                                                                                {
                                                                                    ...(prev[
                                                                                        r
                                                                                            .id
                                                                                    ] || {
                                                                                        enterpriseName:
                                                                                            '',
                                                                                        productName:
                                                                                            '',
                                                                                        products:
                                                                                            [],
                                                                                        services:
                                                                                            [],
                                                                                    }),
                                                                                    productName:
                                                                                        v ||
                                                                                        '',
                                                                                    products:
                                                                                        v
                                                                                            ? [
                                                                                                  v,
                                                                                              ]
                                                                                            : [],
                                                                                },
                                                                        };

                                                                    // Immediately schedule save for this enterprise to prevent data loss
                                                                    const eid =
                                                                        rowIdToEnterpriseIdRef
                                                                            .current[
                                                                            r.id
                                                                        ];
                                                                    if (eid) {
                                                                        // Use setTimeout to ensure this runs after state update
                                                                        setTimeout(
                                                                            () =>
                                                                                scheduleSaveForEnterprise(
                                                                                    eid,
                                                                                ),
                                                                            0,
                                                                        );
                                                                    }

                                                                    return newValues;
                                                                },
                                                            );
                                                        }}
                                                        placeholder='Select Product'
                                                    />
                                                </div>
                                            )}
                                            {cols.includes('services') && (
                                                <div className='text-slate-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-2'>
                                                    <div className='flex items-start justify-between gap-2 mb-1'>
                                                        <div className='flex flex-wrap gap-1'>
                                                            {(
                                                                rowValues[r.id]
                                                                    ?.services ||
                                                                []
                                                            ).map((s, i) => (
                                                                <ServiceChip
                                                                    key={`${r.id}-svc-${i}`}
                                                                    text={s}
                                                                    onRemove={() => {
                                                                        setRowValues(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const curr =
                                                                                    prev[
                                                                                        r
                                                                                            .id
                                                                                    ] || {
                                                                                        enterpriseName:
                                                                                            '',
                                                                                        productName:
                                                                                            '',
                                                                                        services:
                                                                                            [],
                                                                                    };
                                                                                const nextServices =
                                                                                    curr.services.filter(
                                                                                        (
                                                                                            x,
                                                                                        ) =>
                                                                                            x !==
                                                                                            s,
                                                                                    );

                                                                                // Auto-save when service is removed
                                                                                const eid =
                                                                                    rowIdToEnterpriseIdRef
                                                                                        .current[
                                                                                        r
                                                                                            .id
                                                                                    ];
                                                                                console.log(
                                                                                    '🗑️ Service removed:',
                                                                                    s,
                                                                                    'for row:',
                                                                                    r.id,
                                                                                    'enterprise ID:',
                                                                                    eid,
                                                                                );
                                                                                if (
                                                                                    eid
                                                                                ) {
                                                                                    console.log(
                                                                                        '⏰ Scheduling auto-save for enterprise:',
                                                                                        eid,
                                                                                    );
                                                                                    setTimeout(
                                                                                        () =>
                                                                                            scheduleSaveForEnterprise(
                                                                                                eid,
                                                                                            ),
                                                                                        100,
                                                                                    );
                                                                                } else {
                                                                                    console.warn(
                                                                                        '⚠️ No enterprise ID found for row:',
                                                                                        r.id,
                                                                                    );
                                                                                }

                                                                                return {
                                                                                    ...prev,
                                                                                    [r.id]:
                                                                                        {
                                                                                            ...curr,
                                                                                            services:
                                                                                                nextServices,
                                                                                        },
                                                                                };
                                                                            },
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                        {(
                                                            rowValues[r.id]
                                                                ?.services || []
                                                        ).length > 0 && (
                                                            <AddMoreButton
                                                                onClick={() =>
                                                                    setSvcOpenSignals(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [r.id]:
                                                                                Date.now(),
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                    <ECServicesDropdown
                                                        selected={
                                                            rowValues[r.id]
                                                                ?.services || []
                                                        }
                                                        externalOpenKey={
                                                            svcOpenSignals[r.id]
                                                        }
                                                        onToggle={(name) =>
                                                            setRowValues(
                                                                (prev) => {
                                                                    const curr =
                                                                        prev[
                                                                            r.id
                                                                        ] || {
                                                                            enterpriseName:
                                                                                '',
                                                                            productName:
                                                                                '',
                                                                            services:
                                                                                [],
                                                                        };
                                                                    const exists =
                                                                        curr.services.includes(
                                                                            name,
                                                                        );
                                                                    const nextList =
                                                                        exists
                                                                            ? curr.services.filter(
                                                                                  (
                                                                                      x,
                                                                                  ) =>
                                                                                      x !==
                                                                                      name,
                                                                              )
                                                                            : [
                                                                                  ...curr.services,
                                                                                  name,
                                                                              ];

                                                                    // Immediately schedule save for this enterprise to prevent data loss
                                                                    const eid =
                                                                        rowIdToEnterpriseIdRef
                                                                            .current[
                                                                            r.id
                                                                        ];
                                                                    const action =
                                                                        exists
                                                                            ? 'removed'
                                                                            : 'added';
                                                                    console.log(
                                                                        `🔄 Service ${action}:`,
                                                                        name,
                                                                        'for row:',
                                                                        r.id,
                                                                        'enterprise ID:',
                                                                        eid,
                                                                    );
                                                                    if (eid) {
                                                                        console.log(
                                                                            '⏰ Scheduling auto-save for enterprise:',
                                                                            eid,
                                                                        );
                                                                        // Use setTimeout to ensure this runs after state update
                                                                        setTimeout(
                                                                            () =>
                                                                                scheduleSaveForEnterprise(
                                                                                    eid,
                                                                                ),
                                                                            100,
                                                                        );
                                                                    } else {
                                                                        console.warn(
                                                                            '⚠️ No enterprise ID found for row:',
                                                                            r.id,
                                                                            'in rowIdToEnterpriseIdRef',
                                                                        );
                                                                    }

                                                                    return {
                                                                        ...prev,
                                                                        [r.id]:
                                                                            {
                                                                                ...curr,
                                                                                services:
                                                                                    nextList,
                                                                            },
                                                                    };
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </SwipeRow>
                                    ))}
                            </AnimatePresence>
                            {addingRows.map((d) => (
                                <motion.div
                                    key={d.key}
                                    layout
                                    initial={{opacity: 0, y: -4}}
                                    animate={{opacity: 1, y: 0}}
                                    className={`relative w-full grid items-center gap-0 rounded-md overflow-visible border-0 ${
                                        savingKeysRef.current.has(d.key)
                                            ? 'bg-green-50 border border-green-200'
                                            : 'bg-slate-50'
                                    }`}
                                    style={{gridTemplateColumns: cssTemplate}}
                                >
                                    <div className='sticky left-0 z-10 bg-slate-50 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)] px-2 py-2 border-r border-slate-200'>
                                        <ECAsyncChipSelect
                                            type='enterprise'
                                            value={d.entName}
                                            onChange={(v) => {
                                                setAddingRows((prev) =>
                                                    prev.map((r) =>
                                                        r.key === d.key
                                                            ? {
                                                                  ...r,
                                                                  entName:
                                                                      v || '',
                                                              }
                                                            : r,
                                                    ),
                                                );

                                                // Auto-save when both enterprise and product are selected
                                                if (d.productName && v) {
                                                    console.log(
                                                        '🔄 Debouncing save: Enterprise + Product both selected',
                                                    );
                                                    debouncedSaveDraft(d.key);
                                                }
                                            }}
                                            placeholder='Select Enterprise'
                                        />
                                    </div>
                                    <div className='px-2 py-2 border-r border-slate-200'>
                                        <ECAsyncChipSelect
                                            type='product'
                                            value={d.productName}
                                            onChange={(v) => {
                                                setAddingRows((prev) =>
                                                    prev.map((r) =>
                                                        r.key === d.key
                                                            ? {
                                                                  ...r,
                                                                  productName:
                                                                      v || '',
                                                              }
                                                            : r,
                                                    ),
                                                );

                                                // Auto-save when both enterprise and product are selected
                                                if (d.entName && v) {
                                                    console.log(
                                                        '🔄 Debouncing save: Product + Enterprise both selected',
                                                    );
                                                    debouncedSaveDraft(d.key);
                                                }
                                            }}
                                            placeholder='Select Product(s)'
                                        />
                                    </div>
                                    <div className='px-2 py-2 border-r border-slate-200'>
                                        <div className='flex items-start justify-between gap-2 mb-1'>
                                            <div className='flex flex-wrap gap-1'>
                                                {d.services.map((s) => (
                                                    <ServiceChip
                                                        key={s}
                                                        text={s}
                                                        onRemove={() => {
                                                            setAddingRows(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (r) =>
                                                                            r.key ===
                                                                            d.key
                                                                                ? {
                                                                                      ...r,
                                                                                      services:
                                                                                          r.services.filter(
                                                                                              (
                                                                                                  x,
                                                                                              ) =>
                                                                                                  x !==
                                                                                                  s,
                                                                                          ),
                                                                                  }
                                                                                : r,
                                                                    ),
                                                            );

                                                            // Auto-save when service is removed (if enterprise and product exist)
                                                            if (
                                                                d.entName &&
                                                                d.productName
                                                            ) {
                                                                console.log(
                                                                    '🔄 Debouncing save: Service removed',
                                                                );
                                                                // Use debounced save to collect all service changes
                                                                debouncedSaveDraft(
                                                                    d.key,
                                                                );
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            {d.services.length > 0 && (
                                                <AddMoreButton
                                                    onClick={() =>
                                                        setDraftSvcOpenSignals(
                                                            (prev) => ({
                                                                ...prev,
                                                                [d.key]:
                                                                    Date.now(),
                                                            }),
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                        <ECServicesDropdown
                                            selected={d.services}
                                            externalOpenKey={
                                                draftSvcOpenSignals[d.key]
                                            }
                                            onToggle={(name) => {
                                                setAddingRows((prev) =>
                                                    prev.map((r) =>
                                                        r.key === d.key
                                                            ? {
                                                                  ...r,
                                                                  services:
                                                                      r.services.includes(
                                                                          name,
                                                                      )
                                                                          ? r.services.filter(
                                                                                (
                                                                                    x,
                                                                                ) =>
                                                                                    x !==
                                                                                    name,
                                                                            )
                                                                          : [
                                                                                ...r.services,
                                                                                name,
                                                                            ],
                                                              }
                                                            : r,
                                                    ),
                                                );

                                                // Auto-save when services are modified (if enterprise and product exist)
                                                if (
                                                    d.entName &&
                                                    d.productName
                                                ) {
                                                    console.log(
                                                        '🔄 Debouncing save: Service modified',
                                                    );
                                                    // Use debounced save to collect all service changes
                                                    debouncedSaveDraft(d.key);
                                                }
                                            }}
                                        />
                                    </div>
                                    {savingKeysRef.current.has(d.key) && (
                                        <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                            <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
                                            Auto-saving...
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            <motion.div
                                key={'quick-add-enterprise-config'}
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                whileHover={{scale: 1.002}}
                                className='w-full grid items-center gap-0 rounded-md border border-dashed border-slate-300 bg-slate-50/40 hover:bg-slate-100/70 cursor-pointer'
                                style={{gridTemplateColumns: cssTemplate}}
                                data-ec-add='true'
                                onClick={() => {
                                    addBlankRow();
                                    try {
                                        const btn = document.querySelector(
                                            'button:contains("Select enterprise")',
                                        ) as HTMLButtonElement | null;
                                        btn?.focus();
                                    } catch {}
                                }}
                                title='Add new row'
                            >
                                <div className='col-span-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-500'>
                                    <span className='inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300'>
                                        +
                                    </span>
                                    <span>Add new row</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmModal
                open={!!confirmRow}
                title='Confirm delete'
                message={`Delete ${(() => {
                    if (!confirmRow) return 'this configuration';
                    const ent = confirmRow.enterpriseName || 'enterprise';
                    const prod = confirmRow.productName || '';
                    return prod && prod !== '—' ? `${ent} • ${prod}` : ent;
                })()}?\n\nThis action can’t be undone. The item will be permanently removed.`}
                onCancel={() => setConfirmRow(null)}
                onConfirm={() => {
                    if (!confirmRow) return;
                    const row = confirmRow;
                    setConfirmRow(null);
                    setHiddenIds((prev) => {
                        const next = new Set(prev);
                        next.add(row.id);
                        return next;
                    });
                    setTimeout(() => {
                        if (onDeleteImmediate) onDeleteImmediate(row);
                        else onDelete(row);
                    }, 220);
                }}
            />
        </>
    );
}
