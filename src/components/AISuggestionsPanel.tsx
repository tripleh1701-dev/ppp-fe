'use client';

import {useEffect, useMemo, useState} from 'react';
import {api} from '@/utils/api';
import {usePathname} from 'next/navigation';

interface SuggestionItem {
    id: string;
    icon: string;
    title: string;
    description: string;
    confidence: number; // 0-100
    type: 'suggestion' | 'action' | 'insight';
    tags?: string[];
    details?: string[];
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export default function AISuggestionsPanel() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<
        'suggestion' | 'action' | 'insight'
    >('suggestion');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [remoteItems, setRemoteItems] = useState<SuggestionItem[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const r = pathname || '';
                const insights = await api.get<
                    {title: string; body: string; severity?: string}[]
                >(
                    `/api/ai/insights${
                        r ? `?route=${encodeURIComponent(r)}` : ''
                    }`,
                );
                const mapped: SuggestionItem[] = (insights || []).map(
                    (i, idx) => ({
                        id: `ai-${idx}`,
                        icon: 'sparkles',
                        title: i.title,
                        description: i.body,
                        confidence: 90,
                        type: 'insight',
                        tags: ['ai'],
                    }),
                );
                setRemoteItems(mapped);
            } catch {
                // ignore
            }
        })();
    }, [pathname]);

    const allItems: SuggestionItem[] = useMemo(() => {
        const base: SuggestionItem[] = [
            {
                id: 's-1',
                icon: 'sparkles',
                title: 'Smart Suggestions',
                description:
                    'Personalized CI/CD tips based on your current context.',
                confidence: 92,
                type: 'suggestion',
                tags: ['context-aware', 'ci/cd'],
                details: [
                    'Prioritize flaky test remediation to stabilize nightly builds.',
                    'Enable test-impact analysis to cut feedback time by ~20%.',
                ],
                actionLabel: 'Review',
            },
            {
                id: 'a-1',
                icon: 'bolt',
                title: 'Quick Actions',
                description:
                    'Run common automations (retry last failed build, re-run flaky tests).',
                confidence: 88,
                type: 'action',
                tags: ['automation', 'speed'],
                details: [
                    'Retry failed step with cache disabled',
                    'Re-run flaky suite with quarantine',
                ],
                actionLabel: 'Run',
                secondaryActionLabel: 'Preview Plan',
            },
            {
                id: 'i-1',
                icon: 'chart-bar',
                title: 'Release readiness',
                description:
                    'Stability score improved this week. Consider promoting latest build to staging.',
                confidence: 89,
                type: 'insight',
                tags: ['quality', 'readiness'],
                details: [
                    'MTTR down 11%',
                    'Rollback rate 1.2%',
                    'Change failure rate 6%',
                ],
                actionLabel: 'Promote',
            },
        ];

        if ((pathname || '').startsWith('/pipelines')) {
            base.push({
                id: 'p-1',
                icon: 'wrench',
                title: 'Pipeline optimization',
                description:
                    'Enable caching and parallel steps to reduce build time by ~12-18%.',
                confidence: 86,
                type: 'suggestion',
                tags: ['cache', 'parallel'],
                details: ['Cache hit rate 72%', 'Parallel fan-out 3x → 4x'],
                actionLabel: 'Optimize',
                secondaryActionLabel: 'See Diff',
            });
        } else if (
            (pathname || '').startsWith('/account-settings/global-settings')
        ) {
            base.push(
                {
                    id: 'gs-1',
                    icon: 'chart-bar',
                    title: 'Tool coverage suggestions',
                    description:
                        'Adopt code scanning (e.g., SonarQube) and deployment validations (e.g., Argo CD health checks).',
                    confidence: 85,
                    type: 'suggestion',
                    tags: ['governance', 'quality'],
                    details: [
                        'Enable PR quality gates',
                        'Set required checks on main branch',
                        'Add drift detection for clusters',
                    ],
                    actionLabel: 'Review Controls',
                },
                {
                    id: 'gs-2',
                    icon: 'bolt',
                    title: 'Cost-aware pipeline plans',
                    description:
                        'Use on-demand runners for nightly workloads and cache dependencies to cut compute by ~15-25%.',
                    confidence: 82,
                    type: 'insight',
                    tags: ['cost', 'performance'],
                    details: [
                        'Runner utilization 58%',
                        'S3 cache hit low (41%)',
                    ],
                    actionLabel: 'Optimize Caching',
                },
            );
        } else if (
            (pathname || '').startsWith(
                '/account-settings/business-unit-settings',
            )
        ) {
            base.push(
                {
                    id: 'bu-1',
                    icon: 'users',
                    title: 'Entity alignment',
                    description:
                        'Ensure BU entities map to active enterprises to prevent orphaned configs and access drift.',
                    confidence: 84,
                    type: 'insight',
                    tags: ['entities', 'alignment'],
                    details: [
                        '2 entities unused > 60 days',
                        'Suggest archive or merge',
                    ],
                    actionLabel: 'View Entities',
                },
                {
                    id: 'bu-2',
                    icon: 'lock-closed',
                    title: 'Scoped access policies',
                    description:
                        'Apply least-privilege at entity level; review group membership and token scopes.',
                    confidence: 86,
                    type: 'suggestion',
                    tags: ['governance', 'access'],
                    details: [
                        'Rotate 1 stale PAT',
                        'Restrict admin in non-prod',
                    ],
                    actionLabel: 'Review Policies',
                },
            );
        } else if ((pathname || '').startsWith('/account-settings')) {
            base.push({
                id: 'acc-roles',
                icon: 'users',
                title: 'Access management',
                description:
                    'Align user roles and groups with active pipelines to tighten governance.',
                confidence: 83,
                type: 'insight',
                tags: ['roles', 'governance'],
                details: [
                    '2 groups with broad access',
                    'Suggest scoping per environment',
                ],
                actionLabel: 'Review Roles',
            });
        } else if ((pathname || '').startsWith('/access-control')) {
            base.push({
                id: 'ac-1',
                icon: 'lock-closed',
                title: 'Least-privilege checks',
                description:
                    'AI detected groups with wide permissions. Consider scoping rules per service.',
                confidence: 87,
                type: 'insight',
                tags: ['security', 'least-privilege'],
                details: [
                    '3 users with admin in non-prod',
                    'No rotation on 1 PAT',
                ],
                actionLabel: 'View Groups',
            });
        }

        return base.concat(remoteItems);
    }, [pathname, remoteItems]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return allItems
            .filter((i) => i.type === activeTab)
            .filter(
                (i) =>
                    !q ||
                    i.title.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q) ||
                    (i.tags || []).some((t) => t.toLowerCase().includes(q)),
            );
    }, [allItems, query, activeTab]);

    function renderIcon(name: string) {
        const pathByName: Record<string, string> = {
            sparkles:
                'M5 3l1.5 3L10 7l-3.5 1L5 11l-1.5-3L0 7l3.5-1L5 3zm9 1l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zm-3 7l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z',
            bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
            'chart-bar': 'M3 3v18h18M7 13h2v5H7zm4-8h2v13h-2zm4 6h2v7h-2z',
            wrench: 'M13.7 10.3a5 5 0 01-7.4 6.6l-3 3a1 1 0 11-1.4-1.4l3-3a5 5 0 016.6-7.4l3-3a2 2 0 112.8 2.8l-3 3z',
            users: 'M17 20h5v-2a4 4 0 00-4-4h-1m-6 6H3v-2a4 4 0 014-4h6m-3-4a4 4 0 100-8 4 4 0 000 8z',
            'lock-closed':
                'M12 11c-1.657 0-3 1.343-3 3v4h6v-4c0-1.657-1.343-3-3-3zm6 3v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4a6 6 0 1112 0z',
        };
        const d = pathByName[name] || pathByName.sparkles;
        return (
            <svg
                className='w-5 h-5 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <path
                    d={d}
                    strokeWidth={2}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
            </svg>
        );
    }

    return (
        <aside
            className={
                'h-full border-l border-light bg-card flex flex-col shrink-0 transition-all duration-200 ' +
                (isCollapsed ? 'w-12' : 'w-96')
            }
        >
            {/* Header */}
            <div className='flex items-center justify-between px-3 py-3 border-b border-light'>
                <div className='flex items-center gap-2'>
                    <svg
                        className='w-4 h-4 text-primary'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 7a4 4 0 10-2 0m1 4v4m-4 0h8'
                        />
                    </svg>
                    {!isCollapsed && (
                        <h3 className='text-sm font-semibold text-primary'>
                            AI Assistant
                        </h3>
                    )}
                </div>
                <button
                    aria-label='Toggle AI panel'
                    className='text-secondary hover:text-primary transition-colors text-sm'
                    onClick={() => setIsCollapsed((v) => !v)}
                    title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                    {isCollapsed ? '‹' : '›'}
                </button>
            </div>

            {/* Controls */}
            {!isCollapsed && (
                <div className='px-3 py-2 border-b border-light space-y-2'>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='Search tips, actions, insights...'
                        className='w-full text-sm px-3 py-2 rounded-md border border-light bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary/20'
                    />
                    <div className='flex gap-1 text-xs'>
                        {[
                            {k: 'suggestion', label: 'Suggestions'},
                            {k: 'action', label: 'Actions'},
                            {k: 'insight', label: 'Insights'},
                        ].map((t) => (
                            <button
                                key={t.k}
                                onClick={() => setActiveTab(t.k as any)}
                                className={`px-2.5 py-1 rounded-md border transition ${
                                    activeTab === (t.k as any)
                                        ? 'bg-primary text-inverse border-primary'
                                        : 'bg-tertiary border-light text-primary hover:bg-slate-200'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            {!isCollapsed && (
                <div className='flex-1 overflow-y-auto p-3 space-y-3'>
                    {filtered.map((s) => (
                        <div
                            key={s.id}
                            className='rounded-lg border border-light bg-white/70 hover:bg-white transition shadow-sm p-3'
                        >
                            <div className='flex items-start gap-3'>
                                <div className='text-xl leading-none'>
                                    {renderIcon(s.icon)}
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <div className='flex items-center justify-between gap-2'>
                                        <div className='truncate font-medium text-primary'>
                                            {s.title}
                                        </div>
                                        <div className='text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700'>
                                            {s.confidence}%
                                        </div>
                                    </div>
                                    <p className='text-xs text-secondary mt-1'>
                                        {s.description}
                                    </p>
                                    {s.tags && s.tags.length > 0 && (
                                        <div className='flex flex-wrap gap-1 mt-2'>
                                            {s.tags.map((t) => (
                                                <span
                                                    key={t}
                                                    className='text-[10px] px-2 py-0.5 rounded-full bg-tertiary border border-light text-primary'
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {s.details && s.details.length > 0 && (
                                        <div className='mt-2'>
                                            <button
                                                className='text-[11px] text-brand hover:text-brand-dark'
                                                onClick={() =>
                                                    setExpandedId((id) =>
                                                        id === s.id
                                                            ? null
                                                            : s.id,
                                                    )
                                                }
                                            >
                                                {expandedId === s.id
                                                    ? 'Hide details'
                                                    : 'Show details'}
                                            </button>
                                            {expandedId === s.id && (
                                                <ul className='mt-1 list-disc list-inside text-[12px] text-primary space-y-1'>
                                                    {s.details.map((d, i) => (
                                                        <li key={i}>{d}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                    <div className='mt-2 flex gap-2'>
                                        {s.actionLabel && (
                                            <button
                                                className='text-xs px-2.5 py-1 rounded-md border border-primary bg-primary text-inverse hover:bg-primary-dark transition'
                                                onClick={s.onAction}
                                            >
                                                {s.actionLabel}
                                            </button>
                                        )}
                                        {s.secondaryActionLabel && (
                                            <button
                                                className='text-xs px-2.5 py-1 rounded-md border border-light bg-tertiary hover:bg-slate-200 text-primary transition'
                                                onClick={s.onSecondaryAction}
                                            >
                                                {s.secondaryActionLabel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Quick shortcuts */}
                    <div className='mt-4 p-3 rounded-lg border border-light bg-white/70'>
                        <div className='text-[11px] font-semibold text-primary mb-2'>
                            Quick shortcuts
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {[
                                'Retry last failed build',
                                'Open pipeline YAML',
                                'View test analytics',
                                'Open access audit',
                            ].map((q) => (
                                <button
                                    key={q}
                                    className='text-[11px] px-2 py-1 rounded-md border border-light bg-tertiary hover:bg-slate-200 text-primary'
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
