'use client';

import {useEffect, useMemo, useState} from 'react';
import {api} from '@/utils/api';
import DraggableSortableTable from './DraggableSortableTable';

interface DashboardMetric {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon: string;
}

const dashboardMetrics: DashboardMetric[] = [
    {
        title: 'Recent Build Cycles',
        value: '23',
        change: '+12%',
        trend: 'up',
        icon: 'builds',
    },
    {
        title: 'Active Pipelines',
        value: '8',
        change: '+2',
        trend: 'up',
        icon: 'pipelines',
    },
    {
        title: 'Success Rate',
        value: '94.2%',
        change: '+1.2%',
        trend: 'up',
        icon: 'success',
    },
    {
        title: 'Avg Build Time',
        value: '3.2m',
        change: '-0.8m',
        trend: 'up',
        icon: 'time',
    },
];

const recentBuilds = [
    {
        id: 1,
        pipeline: 'Frontend CI/CD',
        branch: 'main',
        status: 'success',
        time: '2m 34s',
        repo: 'web-app',
    },
    {
        id: 2,
        pipeline: 'API Build',
        branch: 'develop',
        status: 'running',
        time: '1m 12s',
        repo: 'backend-api',
    },
    {
        id: 3,
        pipeline: 'Mobile Deploy',
        branch: 'release/v2.1',
        status: 'success',
        time: '4m 56s',
        repo: 'mobile-app',
    },
    {
        id: 4,
        pipeline: 'Database Migration',
        branch: 'feature/schema-update',
        status: 'failed',
        time: '0m 45s',
        repo: 'db-scripts',
    },
    {
        id: 5,
        pipeline: 'Docker Build',
        branch: 'main',
        status: 'success',
        time: '3m 21s',
        repo: 'containerization',
    },
];

const recentReleases = [
    {
        id: 1,
        pipeline: 'Production Deploy',
        environment: 'Prod',
        buildRef: 'Build #142',
        status: 'Completed',
    },
    {
        id: 2,
        pipeline: 'Staging Deploy',
        environment: 'Stage',
        buildRef: 'Build #141',
        status: 'Completed',
    },
    {
        id: 3,
        pipeline: 'QA Deploy',
        environment: 'QA',
        buildRef: 'Build #140',
        status: 'In Progress',
    },
];

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'success':
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'running':
        case 'in progress':
            return 'bg-blue-100 text-blue-800';
        case 'failed':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getIconSvg = (iconName: string) => {
    const iconMap: {[key: string]: string} = {
        builds: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />`,
        pipelines: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />`,
        success: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
        time: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    };
    return iconMap[iconName] || iconMap.builds;
};

export default function DashboardHome() {
    const [refreshing, setRefreshing] = useState(false);
    const [aiInsights, setAiInsights] = useState<
        Array<{
            title: string;
            body: string;
            severity: 'info' | 'warning' | 'success';
        }>
    >([]);
    const [aiSeries, setAiSeries] = useState<
        Array<{label: string; value: number}>
    >([]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const [ins, series] = await Promise.all([
                api.get<typeof aiInsights>('/api/ai/insights'),
                api.get<typeof aiSeries>('/api/ai/trends/builds'),
            ]);
            setAiInsights(ins as any);
            setAiSeries(series as any);
        } catch {}
        setRefreshing(false);
    };

    useEffect(() => {
        handleRefresh().catch(() => {});
    }, []);

    const buildTableItems = useMemo(
        () =>
            recentBuilds.map((b) => ({
                id: String(b.id),
                name: `${b.pipeline} · ${b.branch}`,
                qty: b.time,
            })),
        [],
    );

    const releaseTableItems = useMemo(
        () =>
            recentReleases.map((r) => ({
                id: String(r.id),
                name: `${r.pipeline} · ${r.environment}`,
                qty: r.buildRef,
            })),
        [],
    );

    return (
        <div className='h-full bg-slate-50 flex flex-col'>
            {/* Header - Compact */}
            <div className='bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-lg font-bold text-slate-900'>
                            Enterprise DevOps Dashboard
                        </h1>
                        <p className='text-xs text-slate-600 mt-0.5'>
                            Enterprise CI/CD management and monitoring center
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className='flex items-center space-x-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-all duration-200 ease-in-out hover:shadow-sm text-xs font-medium'
                    >
                        <svg
                            className={`w-3.5 h-3.5 ${
                                refreshing ? 'animate-spin' : ''
                            }`}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                            />
                        </svg>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Content - Compact layout with proper height constraints */}
            <div className='flex-1 p-4 space-y-4 overflow-hidden'>
                {/* AI Insight Cards - Compact grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {aiInsights.slice(0, 3).map((c, i) => (
                        <div
                            key={i}
                            className={`rounded-md border p-3 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out ${
                                c.severity === 'warning'
                                    ? 'border-amber-200 bg-amber-50/60 hover:bg-amber-50'
                                    : c.severity === 'success'
                                    ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50'
                                    : 'border-sky-200 bg-sky-50/60 hover:bg-sky-50'
                            }`}
                        >
                            <div className='text-xs font-semibold text-slate-900 mb-1'>
                                {c.title}
                            </div>
                            <div className='text-xs text-slate-700 leading-relaxed'>
                                {c.body}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Metrics Grid - Compact layout */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
                    {dashboardMetrics.map((metric, index) => (
                        <div
                            key={index}
                            className='bg-white rounded-md shadow-sm border border-slate-200 p-3 hover:shadow-md hover:border-primary-300 transition-all duration-200 ease-in-out'
                        >
                            <div className='flex items-center justify-between'>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-xs font-medium text-slate-600 mb-0.5'>
                                        {metric.title}
                                    </p>
                                    <p className='text-lg font-bold text-slate-900 mb-0.5'>
                                        {metric.value}
                                    </p>
                                    <p
                                        className={`text-xs font-medium ${
                                            metric.trend === 'up'
                                                ? 'text-green-600'
                                                : metric.trend === 'down'
                                                ? 'text-red-600'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        {metric.change}
                                    </p>
                                </div>
                                <div className='w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-md flex items-center justify-center shadow-sm'>
                                    <svg
                                        className='w-5 h-5 text-white'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <g
                                            dangerouslySetInnerHTML={{
                                                __html: getIconSvg(metric.icon),
                                            }}
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trends and Tables - Compact layout */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0'>
                    {/* AI Trend Spark Bars - Compact */}
                    <div className='bg-white rounded-md shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-200 ease-in-out'>
                        <div className='flex items-center justify-between mb-3'>
                            <h3 className='text-sm font-semibold text-slate-900'>
                                AI Trend: Daily Successful Builds
                            </h3>
                            <span className='text-xs text-slate-500'>
                                from backend
                            </span>
                        </div>
                        <div className='grid grid-cols-7 gap-1.5 h-16 items-end'>
                            {aiSeries.map((d) => (
                                <div
                                    key={d.label}
                                    className='flex flex-col items-center gap-1'
                                >
                                    <div
                                        className='w-3 rounded bg-gradient-to-b from-primary-600 to-primary-400 shadow-sm'
                                        style={{
                                            height: `${6 + d.value * 2.5}px`,
                                        }}
                                    />
                                    <div className='text-xs text-slate-500 font-medium'>
                                        {d.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Build Cycles - Compact table */}
                    <div className='bg-white rounded-md shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-200 ease-in-out'>
                        <DraggableSortableTable
                            title='Recent Build Cycles'
                            initialItems={buildTableItems.slice(0, 5)}
                            columnLabels={{
                                name: 'Build Pipeline · Branch',
                                qty: 'Duration',
                            }}
                            accent='blue'
                            dense
                            frameless
                        />
                    </div>

                    {/* Recent Release Cycles - Compact table */}
                    <div className='bg-white rounded-md shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-200 ease-in-out'>
                        <DraggableSortableTable
                            title='Recent Release Cycles'
                            initialItems={releaseTableItems.slice(0, 4)}
                            columnLabels={{
                                name: 'Release Pipeline · Env',
                                qty: 'Build Ref',
                            }}
                            accent='emerald'
                            dense
                            frameless
                        />
                    </div>
                </div>

                {/* API Test Component removed */}
            </div>
        </div>
    );
}
