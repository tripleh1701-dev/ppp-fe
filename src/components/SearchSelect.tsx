'use client';

import React, {useEffect, useRef, useState} from 'react';

interface OptionItem {
    id: string;
    name: string;
}

export default function SearchSelect({
    placeholder,
    value,
    onChange,
    fetchOptions,
}: {
    placeholder: string;
    value: {id: string; name: string} | null;
    onChange: (opt: {id: string; name: string} | null) => void;
    fetchOptions: (query: string) => Promise<OptionItem[]>;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<OptionItem[]>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (containerRef.current && !containerRef.current.contains(t)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        fetchOptions(query)
            .then((res) => setItems(Array.isArray(res) ? res : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [open, query, fetchOptions]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    return (
        <div ref={containerRef} className='relative'>
            <button
                type='button'
                onClick={() => setOpen((v) => !v)}
                className='flex w-full items-center justify-between rounded-lg border border-light bg-card px-3 py-2.5 text-left text-primary hover:bg-slate-50'
            >
                <span
                    className={`truncate ${
                        value ? 'text-primary' : 'text-secondary'
                    }`}
                >
                    {value?.name || placeholder}
                </span>
                <svg
                    className='h-4 w-4 text-secondary'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                >
                    <path d='M6 9l6 6 6-6' />
                </svg>
            </button>
            {open && (
                <div className='absolute z-50 mt-2 w-full rounded-xl border border-light bg-card shadow-xl'>
                    <div className='p-2 border-b border-light'>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${placeholder.toLowerCase()}s`}
                            className='w-full rounded-md border border-light px-3 py-2 text-sm placeholder-secondary'
                        />
                    </div>
                    <div className='max-h-64 overflow-auto p-1'>
                        {loading ? (
                            <div className='px-3 py-2 text-sm text-secondary'>
                                Loading…
                            </div>
                        ) : items.length === 0 ? (
                            <div className='px-3 py-2 text-sm text-secondary'>
                                No results
                            </div>
                        ) : (
                            items.map((opt) => (
                                <button
                                    key={opt.id}
                                    className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                                        value?.id === String(opt.id)
                                            ? 'bg-primary text-inverse'
                                            : 'hover:bg-slate-100 text-primary'
                                    }`}
                                    onClick={() => {
                                        onChange({
                                            id: String(opt.id),
                                            name: opt.name,
                                        });
                                        setOpen(false);
                                    }}
                                >
                                    {opt.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}