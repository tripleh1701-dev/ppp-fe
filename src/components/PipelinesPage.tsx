'use client';

import Link from 'next/link';

interface PipelineCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    href: string;
    features: string[];
    color: string;
}

const pipelineCards: PipelineCard[] = [
    {
        id: 'pipeline-canvas',
        title: 'Pipeline Canvas',
        description: 'Manage your CI/CD workflows',
        icon: 'canvas',
        href: '/pipelines/summary',
        features: [
            'Visual pipeline builder',
            'Drag & drop components',
            'Real-time validation',
            'Custom workflows',
        ],
        color: 'from-blue-500 to-blue-600',
    },
    {
        id: 'smart-pipeline',
        title: 'Smart Pipeline',
        description:
            'AI-powered pipeline generation that automatically creates optimized pipelines based on your project requirements',
        icon: 'smart',
        href: '/pipelines/smart',
        features: [
            'AI-powered automation',
            'Intelligent optimization',
            'Auto-configuration',
            'Best practices built-in',
        ],
        color: 'from-green-500 to-green-600',
    },
    {
        id: 'pipeline-templates',
        title: 'Pipeline Templates',
        description:
            'Start quickly with pre-built pipeline templates for common workflows',
        icon: 'templates',
        href: '/pipelines/templates',
        features: [
            'Pre-built templates',
            'Industry best practices',
            'Customizable workflows',
            'Quick deployment',
        ],
        color: 'from-orange-500 to-orange-600',
    },
];

const getIconSvg = (iconName: string) => {
    const iconMap: {[key: string]: string} = {
        canvas: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />`,
        smart: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />`,
        templates: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />`,
    };
    return iconMap[iconName] || iconMap.canvas;
};

export default function PipelinesPage() {
    return (
        <div className='h-full bg-gray-50 overflow-auto'>
            {/* Header */}
            <div className='bg-white border-b border-sap-border px-6 py-6 sticky top-0 z-10'>
                <div className='max-w-4xl mx-auto'>
                    <div className='text-center'>
                        <h1 className='text-3xl font-bold text-sap-dark-blue'>
                            SAP DevOps Pipelines
                        </h1>
                        <p className='text-sap-gray mt-2 max-w-2xl mx-auto'>
                            Create, manage, and deploy your CI/CD pipelines with
                            our powerful tools. Choose between building custom
                            pipelines or starting with proven templates.
                        </p>
                    </div>
                </div>
            </div>

            <div className='p-6'>
                <div className='max-w-6xl mx-auto'>
                    {/* Pipeline Cards */}
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8'>
                        {pipelineCards.map((card) => (
                            <Link
                                key={card.id}
                                href={card.href}
                                className='block group'
                            >
                                <div className='bg-white rounded-2xl shadow-lg border-2 border-gray-300 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out min-h-[400px]'>
                                    {/* Card Header with Gradient */}
                                    <div
                                        className={`bg-gradient-to-r ${card.color} p-6 text-white relative overflow-hidden`}
                                    >
                                        <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16'></div>
                                        <div className='absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12'></div>
                                        <div className='relative z-10'>
                                            <div className='w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300'>
                                                <svg
                                                    className='w-8 h-8 text-white'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <g
                                                        dangerouslySetInnerHTML={{
                                                            __html: getIconSvg(
                                                                card.icon,
                                                            ),
                                                        }}
                                                    />
                                                </svg>
                                            </div>
                                            <h3 className='text-2xl font-bold mb-2'>
                                                {card.title}
                                            </h3>
                                            <p className='text-white/90 text-lg'>
                                                {card.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className='p-6'>
                                        <div className='space-y-3'>
                                            <h4 className='font-semibold text-gray-900 mb-3'>
                                                Key Features:
                                            </h4>
                                            {card.features.map(
                                                (feature, index) => (
                                                    <div
                                                        key={index}
                                                        className='flex items-center space-x-3 text-gray-700'
                                                    >
                                                        <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0'></div>
                                                        <span className='text-sm font-medium'>
                                                            {feature}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <div className='mt-6 pt-6 border-t border-gray-100'>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-sm text-gray-600'>
                                                    Click to get started
                                                </span>
                                                <div className='flex items-center space-x-2 text-blue-600 group-hover:text-blue-700 font-semibold'>
                                                    <span className='text-sm'>
                                                        Open
                                                    </span>
                                                    <svg
                                                        className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M13 7l5 5m0 0l-5 5m5-5H6'
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Additional Information Section */}
                    <div className='mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
                        <div className='text-center'>
                            <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                                Need Help Getting Started?
                            </h3>
                            <p className='text-gray-600 mb-6 max-w-2xl mx-auto'>
                                Our pipeline tools are designed to be intuitive
                                and powerful. Whether you&apos;re new to CI/CD
                                or an experienced DevOps engineer, we have the
                                right solution for you.
                            </p>
                            <div className='flex flex-wrap justify-center gap-4'>
                                <button className='px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200'>
                                    View Documentation
                                </button>
                                <button className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'>
                                    Watch Tutorial
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
