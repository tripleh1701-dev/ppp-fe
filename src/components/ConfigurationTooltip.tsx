import React, {useRef, useState} from 'react';
import {createPortal} from 'react-dom';

// Tooltip component for configuration details (matches original SelectionPill design)
export function ConfigurationTooltip({
    configuration,
    configurationDetails,
    onIconClick,
    isConfigured = false,
}: {
    configuration: string;
    configurationDetails?: Record<string, string[]>;
    onIconClick?: () => void;
    isConfigured?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{top: number; left: number} | null>(
        null,
    );
    const closeTimer = useRef<number | null>(null);

    const CATEGORY_COLORS: Record<string, string> = {
        plan: '#6366F1',
        code: '#22C55E',
        build: '#F59E0B',
        test: '#06B6D4',
        release: '#EC4899',
        deploy: '#8B5CF6',
        operate: '#64748B',
        monitor: '#64748B',
    };

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

    const hasDetails =
        configurationDetails &&
        Object.values(configurationDetails).some((arr) => arr.length > 0);

    const entries = Object.entries(configurationDetails || {}).map(
        ([cat, tools]) => ({
            cat,
            count: tools.length,
        }),
    );
    const sum = entries.reduce((a, b) => a + b.count, 0) || 1;

    return (
        <>
            <div className='flex items-center gap-2'>
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
                    className='text-[12px] px-1 cursor-help text-slate-700 hover:text-blue-800 font-medium'
                >
                    {configuration}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onIconClick) onIconClick();
                    }}
                    className={`p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                        isConfigured
                            ? 'text-green-600 hover:text-green-700 bg-green-50'
                            : 'text-blue-500 hover:text-blue-700 bg-blue-50'
                    }`}
                    title='Configure'
                >
                    <svg
                        className='w-4 h-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                        />
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                    </svg>
                </button>
            </div>
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
                        className='rounded-xl border border-slate-200 bg-white shadow-2xl p-4 w-auto min-w-[360px] max-w-[500px]'
                        onMouseEnter={clearCloseTimer}
                        onMouseLeave={scheduleClose}
                    >
                        {hasDetails ? (
                            <>
                                <div className='mb-2 text-xs font-semibold text-slate-700'>
                                    Selected Tools
                                </div>
                                {/* Colored progress bar */}
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
                                                            CATEGORY_COLORS[
                                                                cat
                                                            ] || '#64748B',
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                                {/* Grid of categories */}
                                <div className='grid grid-cols-2 gap-3'>
                                    {Object.entries(
                                        configurationDetails || {},
                                    ).map(([cat, list]) => {
                                        if (!list || list.length === 0)
                                            return null;
                                        return (
                                            <div
                                                key={cat}
                                                className='rounded-lg border border-slate-200 p-2'
                                            >
                                                <div className='mb-1 flex items-center justify-between'>
                                                    <div className='text-xs font-semibold capitalize text-slate-700'>
                                                        {cat}
                                                    </div>
                                                    <div className='text-[10px] text-slate-500'>
                                                        {list.length}
                                                    </div>
                                                </div>
                                                <div className='flex flex-wrap gap-1'>
                                                    {list.map((tool) => (
                                                        <span
                                                            key={tool}
                                                            className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-700'
                                                        >
                                                            {tool}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className='text-center py-3'>
                                <div className='text-xs font-semibold text-slate-700 mb-2'>
                                    No tools configured
                                </div>
                                <p className='text-[10px] text-slate-500'>
                                    Click the{' '}
                                    <svg
                                        className='w-3 h-3 inline text-blue-500'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                                        />
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                        />
                                    </svg>{' '}
                                    icon to configure tools for this entity
                                </p>
                            </div>
                        )}
                    </div>,
                    document.body,
                )}
        </>
    );
}
