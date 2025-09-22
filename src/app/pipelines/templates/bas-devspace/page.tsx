'use client';

import Link from 'next/link';

interface PipelineStep {
    id: string;
    title: string;
    description: string;
    type: 'source' | 'build' | 'test' | 'deploy' | 'approval';
    icon: string;
    config?: any;
}

const basDevSpacePipeline: PipelineStep[] = [
    {
        id: 'source',
        title: 'Source Code',
        description: 'Pull DevSpace configuration from Git repository',
        type: 'source',
        icon: 'git',
        config: {
            repository: 'https://github.com/your-org/bas-devspace-config',
            branch: 'main',
            triggers: ['push', 'pull_request'],
        },
    },
    {
        id: 'validate',
        title: 'Validate Configuration',
        description: 'Validate DevSpace configuration and dependencies',
        type: 'test',
        icon: 'validate',
        config: {
            validations: [
                'Config syntax',
                'Extension compatibility',
                'Resource limits',
            ],
            tools: ['BAS CLI', 'Config Validator'],
        },
    },
    {
        id: 'setup',
        title: 'Setup DevSpace',
        description:
            'Create and configure Business Application Studio DevSpace',
        type: 'deploy',
        icon: 'setup',
        config: {
            environment: 'Development',
            devSpaceType: 'Full Stack Cloud Application',
            extensions: [
                'MTA Tools',
                'Destination service',
                'Connectivity service',
            ],
        },
    },
    {
        id: 'install-tools',
        title: 'Install Development Tools',
        description: 'Install required tools and extensions in DevSpace',
        type: 'build',
        icon: 'tools',
        config: {
            tools: ['Cloud Foundry CLI', 'MTA Build Tool', 'UI5 CLI'],
            extensions: ['Cloud Foundry Tools', 'Debugger'],
        },
    },
    {
        id: 'test-environment',
        title: 'Test Development Environment',
        description: 'Verify DevSpace setup and tool functionality',
        type: 'test',
        icon: 'test',
        config: {
            tests: [
                'Tool availability',
                'Connectivity tests',
                'Sample project build',
            ],
            timeout: '10 minutes',
        },
    },
    {
        id: 'approval',
        title: 'Environment Approval',
        description: 'Manual approval for DevSpace deployment',
        type: 'approval',
        icon: 'approval',
        config: {
            approvers: ['DevOps Lead', 'Development Team Lead'],
            criteria: ['All tests passed', 'Resource allocation approved'],
        },
    },
    {
        id: 'finalize',
        title: 'Finalize DevSpace',
        description: 'Complete DevSpace setup and provide access credentials',
        type: 'deploy',
        icon: 'finalize',
        config: {
            environment: 'Production-Ready',
            accessControl: 'Team-based',
            documentation: 'Setup guide and best practices',
        },
    },
];

const getStepIcon = (icon: string) => {
    const iconMap: {[key: string]: string} = {
        git: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />`,
        validate: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
        setup: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />`,
        tools: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />`,
        test: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
        approval: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />`,
        finalize: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />`,
    };
    return iconMap[icon] || iconMap.git;
};

const getStepColor = (type: string) => {
    const colorMap: {[key: string]: string} = {
        source: 'from-blue-500 to-blue-600',
        build: 'from-green-500 to-green-600',
        test: 'from-purple-500 to-purple-600',
        deploy: 'from-orange-500 to-orange-600',
        approval: 'from-yellow-500 to-yellow-600',
    };
    return colorMap[type] || 'from-gray-500 to-gray-600';
};

export default function BASDevSpaceTemplate() {
    return (
        <div className='h-full bg-gray-50 overflow-auto'>
            {/* Header */}
            <div className='bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10'>
                <div className='max-w-6xl mx-auto'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='flex items-center mb-2'>
                                <Link
                                    href='/pipelines/templates'
                                    className='text-blue-600 hover:text-blue-700 mr-2'
                                >
                                    ← Back to Templates
                                </Link>
                            </div>
                            <div className='flex items-center'>
                                <div className='w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4'>
                                    <svg
                                        className='w-6 h-6 text-white'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900'>
                                        BAS DevSpace Pipeline
                                    </h1>
                                    <p className='text-gray-600 mt-1'>
                                        Automated setup and deployment pipeline
                                        for Business Application Studio
                                        development
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='flex space-x-3'>
                            <Link
                                href='/pipelines/canvas?template=bas-devspace'
                                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                            >
                                Customize in Canvas
                            </Link>
                            <button className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200'>
                                Deploy Pipeline
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className='p-6'>
                <div className='max-w-6xl mx-auto'>
                    {/* Pipeline Overview */}
                    <div className='mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                        <h2 className='text-xl font-bold text-gray-900 mb-4'>
                            Pipeline Overview
                        </h2>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='text-center p-4 bg-indigo-50 rounded-lg'>
                                <div className='text-2xl font-bold text-indigo-600'>
                                    7
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Pipeline Steps
                                </div>
                            </div>
                            <div className='text-center p-4 bg-blue-50 rounded-lg'>
                                <div className='text-2xl font-bold text-blue-600'>
                                    ~20-25min
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Estimated Runtime
                                </div>
                            </div>
                            <div className='text-center p-4 bg-green-50 rounded-lg'>
                                <div className='text-2xl font-bold text-green-600'>
                                    Dev Ready
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Environment Setup
                                </div>
                            </div>
                        </div>
                        <div className='mt-4 flex flex-wrap gap-2'>
                            <span className='inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full'>
                                BAS
                            </span>
                            <span className='inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full'>
                                DevSpace
                            </span>
                            <span className='inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full'>
                                Cloud Development
                            </span>
                        </div>
                    </div>

                    {/* Pipeline Flow */}
                    <div className='mb-8'>
                        <h2 className='text-xl font-bold text-gray-900 mb-6'>
                            Pipeline Flow
                        </h2>
                        <div className='relative'>
                            <div className='space-y-6'>
                                {basDevSpacePipeline.map((step, index) => (
                                    <div key={step.id} className='relative'>
                                        {index <
                                            basDevSpacePipeline.length - 1 && (
                                            <div className='absolute left-6 top-12 w-0.5 h-8 bg-gray-300 z-0'></div>
                                        )}

                                        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative z-10'>
                                            <div className='flex items-start space-x-4'>
                                                <div
                                                    className={`w-12 h-12 bg-gradient-to-r ${getStepColor(
                                                        step.type,
                                                    )} rounded-xl flex items-center justify-center flex-shrink-0`}
                                                >
                                                    <svg
                                                        className='w-6 h-6 text-white'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <g
                                                            dangerouslySetInnerHTML={{
                                                                __html: getStepIcon(
                                                                    step.icon,
                                                                ),
                                                            }}
                                                        />
                                                    </svg>
                                                </div>

                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center justify-between mb-2'>
                                                        <h3 className='text-lg font-semibold text-gray-900'>
                                                            Step {index + 1}:{' '}
                                                            {step.title}
                                                        </h3>
                                                        <span
                                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                step.type ===
                                                                'source'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : step.type ===
                                                                      'build'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : step.type ===
                                                                      'test'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : step.type ===
                                                                      'deploy'
                                                                    ? 'bg-orange-100 text-orange-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}
                                                        >
                                                            {step.type
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                                step.type.slice(
                                                                    1,
                                                                )}
                                                        </span>
                                                    </div>
                                                    <p className='text-gray-600 mb-4'>
                                                        {step.description}
                                                    </p>

                                                    {step.config && (
                                                        <div className='bg-gray-50 rounded-lg p-4'>
                                                            <h4 className='font-medium text-gray-900 mb-2'>
                                                                Configuration:
                                                            </h4>
                                                            <div className='space-y-2 text-sm text-gray-600'>
                                                                {Object.entries(
                                                                    step.config,
                                                                ).map(
                                                                    ([
                                                                        key,
                                                                        value,
                                                                    ]) => (
                                                                        <div
                                                                            key={
                                                                                key
                                                                            }
                                                                            className='flex flex-wrap'
                                                                        >
                                                                            <span className='font-medium mr-2 capitalize'>
                                                                                {key
                                                                                    .replace(
                                                                                        /([A-Z])/g,
                                                                                        ' $1',
                                                                                    )
                                                                                    .toLowerCase()}

                                                                                :
                                                                            </span>
                                                                            <span>
                                                                                {Array.isArray(
                                                                                    value,
                                                                                )
                                                                                    ? (
                                                                                          value as string[]
                                                                                      ).join(
                                                                                          ', ',
                                                                                      )
                                                                                    : String(
                                                                                          value,
                                                                                      )}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
