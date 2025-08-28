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
        <div className='h-full bg-sap-light-gray overflow-hidden'>
            {/* Header */}
            <div className='bg-white border-b border-sap-border px-3 py-2 sticky top-0 z-10'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-lg font-bold text-sap-dark-blue'>
                            SAP DevOps Dashboard
                        </h1>
                        <p className='text-sap-gray mt-0.5 text-[11px]'>
                            Enterprise CI/CD management and monitoring center
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className='flex items-center space-x-2 px-3 py-1.5 bg-sap-blue text-white rounded-lg hover:bg-sap-dark-blue disabled:opacity-50 transition-colors duration-200'
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

            <div className='p-2 overflow-hidden'>
                {/* AI Insight Cards */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-2 mb-2'>
                    {aiInsights.slice(0, 3).map((c, i) => (
                        <div
                            key={i}
                            className={`rounded-md border p-2 shadow-sm ${
                                c.severity === 'warning'
                                    ? 'border-amber-200 bg-amber-50/60'
                                    : c.severity === 'success'
                                    ? 'border-emerald-200 bg-emerald-50/60'
                                    : 'border-sky-200 bg-sky-50/60'
                            }`}
                        >
                            <div className='text-[11px] font-semibold text-gray-800 mb-0.5'>
                                {c.title}
                            </div>
                            <div className='text-[11px] text-gray-700 leading-5'>
                                {c.body}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Metrics Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2'>
                    {dashboardMetrics.map((metric, index) => (
                        <div
                            key={index}
                            className='bg-white rounded-md shadow-sm border border-gray-200 p-1.5 hover:shadow-md transition-shadow duration-200'
                        >
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-xs font-medium text-gray-600'>
                                        {metric.title}
                                    </p>
                                    <p className='text-[15px] font-bold text-gray-900 mt-0.5'>
                                        {metric.value}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 ${
                                            metric.trend === 'up'
                                                ? 'text-green-600'
                                                : metric.trend === 'down'
                                                ? 'text-red-600'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        {metric.change}
                                    </p>
                                </div>
                                <div className='w-7 h-7 bg-sap-light-blue rounded-md flex items-center justify-center'>
                                    <svg
                                        className='w-3.5 h-3.5 text-sap-blue'
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

                {/* Trends (AI) + Recent Build/Release */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-hidden'>
                    {/* AI Trend Spark Bars */}
                    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-3'>
                        <div className='flex items-center justify-between mb-2'>
                            <h3 className='text-sm font-semibold text-gray-900'>
                                AI Trend: Daily Successful Builds
                            </h3>
                            <span className='text-[11px] text-gray-500'>
                                from backend
                            </span>
                        </div>
                        <div className='grid grid-cols-7 gap-1 h-20 items-end'>
                            {aiSeries.map((d) => (
                                <div
                                    key={d.label}
                                    className='flex flex-col items-center gap-1'
                                >
                                    <div
                                        className='w-4 rounded bg-sap-blue/70'
                                        style={{height: `${6 + d.value * 3.5}px`}}
                                    />
                                    <div className='text-[10px] text-gray-500'>
                                        {d.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Recent Build Cycles (Draggable & Sortable with old content) */}
                    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-2'>
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

                    {/* Recent Release Cycles (Draggable & Sortable with old content) */}
                    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-2'>
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
            </div>
        </div>
    );
}
