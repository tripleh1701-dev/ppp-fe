'use client';

import {useEffect, useMemo, useState} from 'react';
import {api} from '@/utils/api';
import {usePathname} from 'next/navigation';
import {Icon} from './Icons';
import {motion} from 'framer-motion';

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

interface AISuggestionsPanelProps {
    isMobile?: boolean;
    isTablet?: boolean;
}

export default function AISuggestionsPanel({
    isMobile = false,
    isTablet = false,
}: AISuggestionsPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const [query, setQuery] = useState('');
    const [ActiveTab, setActiveTab] = useState<
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

    // Listen for custom events to control AI panel state
    useEffect(() => {
        const handleCollapseAIPanel = () => {
            setIsCollapsed(true);
        };

        const handleExpandAIPanel = () => {
            setIsCollapsed(false);
        };

        window.addEventListener('collapseAIPanel', handleCollapseAIPanel);
        window.addEventListener('expandAIPanel', handleExpandAIPanel);

        return () => {
            window.removeEventListener(
                'collapseAIPanel',
                handleCollapseAIPanel,
            );
            window.removeEventListener('expandAIPanel', handleExpandAIPanel);
        };
    }, []);

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
                icon: 'chartbar',
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
                    icon: 'chartbar',
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
                        'Ensure BU entities map to Active enterprises to prevent orphaned configs and access drift.',
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
                    'Align user roles and groups with Active pipelines to tighten governance.',
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
            .filter((i) => i.type === ActiveTab)
            .filter(
                (i) =>
                    !q ||
                    i.title.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q) ||
                    (i.tags || []).some((t) => t.toLowerCase().includes(q)),
            );
    }, [allItems, query, ActiveTab]);

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

    // Mobile view remains compact
    if (isMobile) {
        return (
            <div className='bg-white border-b border-slate-200 px-4 py-3 lg:hidden'>
                <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-sm font-medium text-slate-900'>
                        AI Insights
                    </h3>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className='p-1.5 rounded-lg text-white bg-brand-gradient hover:opacity-90 transition-colors duration-200'
                        aria-label={
                            isCollapsed
                                ? 'Expand insights'
                                : 'Collapse insights'
                        }
                    >
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                                isCollapsed ? 'rotate-180' : ''
                            }`}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 9l-7 7-7-7'
                            />
                        </svg>
                    </button>
                </div>

                {!isCollapsed && (
                    <div className='space-y-3'>
                        {/* Search Bar */}
                        <div className='relative'>
                            <input
                                type='text'
                                placeholder='Search AI insights...'
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className='w-full px-3 py-2 pl-9 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200'
                            />
                            <svg
                                className='absolute left-3 top-2.5 w-4 h-4 text-slate-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                                />
                            </svg>
                        </div>

                        {/* Tab Navigation */}
                        <div className='flex space-x-1 bg-slate-100 rounded-lg p-1'>
                            {[
                                {
                                    key: 'suggestion',
                                    label: 'Suggestions',
                                    count: allItems.filter(
                                        (i) => i.type === 'suggestion',
                                    ).length,
                                },
                                {
                                    key: 'action',
                                    label: 'Actions',
                                    count: allItems.filter(
                                        (i) => i.type === 'action',
                                    ).length,
                                },
                                {
                                    key: 'insight',
                                    label: 'Insights',
                                    count: allItems.filter(
                                        (i) => i.type === 'insight',
                                    ).length,
                                },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                                        ActiveTab === tab.key
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-slate-600 hover:text-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                    <span className='ml-1 text-xs text-slate-400'>
                                        ({tab.count})
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Content Cards */}
                        <div className='space-y-3 max-h-64 overflow-y-auto'>
                            {filtered.map((item) => (
                                <div
                                    key={item.id}
                                    className='bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200'
                                >
                                    <div className='flex items-start space-x-3'>
                                        <div className='flex-shrink-0 mt-0.5'>
                                            {renderIcon(item.icon)}
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <h4 className='text-sm font-medium text-slate-900 mb-1'>
                                                {item.title}
                                            </h4>
                                            <p className='text-xs text-slate-600 mb-2 leading-relaxed'>
                                                {item.description}
                                            </p>
                                            {item.tags && (
                                                <div className='flex flex-wrap gap-1 mb-2'>
                                                    {item.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className='px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md'
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {item.actionLabel && (
                                                <button className='text-xs text-primary hover:text-primary-700 font-medium transition-colors duration-200'>
                                                    {item.actionLabel} →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Desktop view with improved design
    return (
        <motion.div
            className={`bg-white shadow-lg transition-all duration-300 ease-in-out h-full flex flex-col ${
                isCollapsed ? 'w-16' : 'w-[300px]'
            }`}
            initial={false}
            animate={{width: isCollapsed ? 64 : 300}}
        >
            {/* Header */}
            <div className='flex items-center justify-between p-3 border-b border-slate-200'>
                <div className='flex items-center gap-2'>
                    <img
                        src='/images/logos/ai-insights-icon.svg'
                        alt='AI'
                        className='w-5 h-5'
                    />
                    {!isCollapsed && (
                        <h3 className='text-base font-semibold text-slate-900'>
                            AI Insights
                        </h3>
                    )}
                </div>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className='p-1.5 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200 ease-in-out'
                    aria-label={
                        isCollapsed ? 'Expand insights' : 'Collapse insights'
                    }
                >
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                            isCollapsed ? 'rotate-180' : ''
                        }`}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 9l-7 7-7-7'
                        />
                    </svg>
                </button>
            </div>

            {!isCollapsed && (
                <div className='p-3 space-y-3 flex-1 flex flex-col min-h-0'>
                    {/* Search Bar */}
                    <div className='relative'>
                        <input
                            type='search'
                            placeholder='Search AI insights...'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className='w-full px-3 py-2 pl-8 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 ease-in-out'
                        />
                        <svg
                            className='absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                            />
                        </svg>
                    </div>

                    {/* Tab Navigation */}
                    <div className='flex space-x-1 bg-slate-100 rounded-md p-1'>
                        {[
                            {
                                key: 'suggestion',
                                label: 'Suggestions',
                                count: allItems.filter(
                                    (i) => i.type === 'suggestion',
                                ).length,
                            },
                            {
                                key: 'action',
                                label: 'Actions',
                                count: allItems.filter(
                                    (i) => i.type === 'action',
                                ).length,
                            },
                            {
                                key: 'insight',
                                label: 'Insights',
                                count: allItems.filter(
                                    (i) => i.type === 'insight',
                                ).length,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ease-in-out ${
                                    ActiveTab === tab.key
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                                }`}
                            >
                                {tab.label}
                                <span className='ml-1 text-xs text-slate-400'>
                                    ({tab.count})
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Content Cards - fill height and scroll */}
                    <div className='space-y-3 flex-1 min-h-0 overflow-y-auto'>
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                className='bg-white border border-slate-200 rounded-md p-3 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 ease-in-out'
                            >
                                <div className='flex items-start space-x-2'>
                                    <div className='flex-shrink-0 mt-0.5'>
                                        {renderIcon(item.icon)}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <h4 className='text-sm font-semibold text-slate-900 mb-1'>
                                            {item.title}
                                        </h4>
                                        <p className='text-xs text-slate-600 mb-2 leading-relaxed'>
                                            {item.description}
                                        </p>
                                        {item.tags && (
                                            <div className='flex flex-wrap gap-1 mb-2'>
                                                {item.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className='px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded font-medium'
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {item.details && (
                                            <div className='mb-2 space-y-0.5'>
                                                {item.details.map(
                                                    (detail, idx) => (
                                                        <div
                                                            key={idx}
                                                            className='flex items-center space-x-1.5 text-xs text-slate-500'
                                                        >
                                                            <div className='w-1 h-1 bg-slate-400 rounded-full'></div>
                                                            <span>
                                                                {detail}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                        {item.actionLabel && (
                                            <button className='inline-flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200 ease-in-out hover:underline'>
                                                {item.actionLabel}
                                                <svg
                                                    className='ml-1 w-3 h-3'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M9 5l7 7-7 7'
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Collapsed state - icon only */}
            {isCollapsed && (
                <div className='flex flex-col items-center justify-center py-3 h-full'>
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className='w-10 h-10 rounded-full hover:ring-2 hover:ring-primary/30 transition'
                        aria-label='Expand AI Insights'
                    >
                        <img
                            src='/images/logos/ai-insights-icon.svg'
                            alt='AI Insights'
                            className='w-8 h-8 mx-auto'
                        />
                    </button>
                </div>
            )}
        </motion.div>
    );
}
