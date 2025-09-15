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

const integrationSuitePipeline: PipelineStep[] = [
    {
        id: 'source',
        title: 'Source Code',
        description: 'Pull integration artifacts from Git repository',
        type: 'source',
        icon: 'git',
        config: {
            repository: 'https://github.com/your-org/integration-flows',
            branch: 'main',
            triggers: ['push', 'pull_request'],
        },
    },
    {
        id: 'validate',
        title: 'Validate Artifacts',
        description: 'Validate integration flow syntax and dependencies',
        type: 'test',
        icon: 'validate',
        config: {
            checks: ['Syntax validation', 'Dependency check', 'Security scan'],
            tools: ['Cloud Integration Linter', 'Dependency Scanner'],
        },
    },
    {
        id: 'build',
        title: 'Package Integration Flows',
        description: 'Build and package integration flows and API artifacts',
        type: 'build',
        icon: 'package',
        config: {
            buildTool: 'Cloud Integration Toolkit',
            outputFormat: 'Integration Package (.zip)',
            includeResources: ['Message mappings', 'Scripts', 'Certificates'],
        },
    },
    {
        id: 'test-deploy',
        title: 'Deploy to Test Environment',
        description: 'Deploy to Integration Suite test tenant',
        type: 'deploy',
        icon: 'test-deploy',
        config: {
            environment: 'Test',
            tenant: 'test-tenant.integration.cloud.example',
            deploymentType: 'Integration Flows + API Artifacts',
        },
    },
    {
        id: 'integration-test',
        title: 'Integration Testing',
        description: 'Run integration tests and API endpoint validation',
        type: 'test',
        icon: 'integration-test',
        config: {
            testSuites: [
                'Message flow tests',
                'API endpoint tests',
                'Error handling tests',
            ],
            tools: ['Postman', 'Integration Test Framework'],
        },
    },
    {
        id: 'approval',
        title: 'Production Approval',
        description: 'Manual approval gate for production deployment',
        type: 'approval',
        icon: 'approval',
        config: {
            approvers: ['Integration Lead', 'Solution Architect'],
            criteria: ['All tests passed', 'Security review completed'],
        },
    },
    {
        id: 'prod-deploy',
        title: 'Deploy to Production',
        description: 'Deploy to Integration Suite production tenant',
        type: 'deploy',
        icon: 'prod-deploy',
        config: {
            environment: 'Production',
            tenant: 'prod-tenant.integration.cloud.example',
            strategy: 'Blue-Green Deployment',
            rollbackEnabled: true,
        },
    },
    {
        id: 'monitoring',
        title: 'Post-Deployment Monitoring',
        description: 'Monitor integration flows and API performance',
        type: 'test',
        icon: 'monitoring',
        config: {
            monitors: [
                'Message processing rates',
                'Error rates',
                'API response times',
            ],
            alerts: ['Slack notifications', 'Email alerts'],
        },
    },
];

const getStepIcon = (icon: string) => {
    const iconMap: {[key: string]: string} = {
        git: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />`,
        validate: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
        package: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />`,
        'test-deploy': `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />`,
        'integration-test': `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />`,
        approval: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />`,
        'prod-deploy': `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />`,
        monitoring: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
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

export default function IntegrationSuiteTemplate() {
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
                                <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4'>
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
                                            d='M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900'>
                                        Integration Suite Pipeline
                                    </h1>
                                    <p className='text-gray-600 mt-1'>
                                        Deploy integration flows and API
                                        management artifacts to Integration
                                        Suite
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='flex space-x-3'>
                            <Link
                                href='/pipelines/canvas?template=sap-integration-suite'
                                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                            >
                                Customize in Canvas
                            </Link>
                            <button className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200'>
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
                            <div className='text-center p-4 bg-orange-50 rounded-lg'>
                                <div className='text-2xl font-bold text-orange-600'>
                                    8
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Pipeline Steps
                                </div>
                            </div>
                            <div className='text-center p-4 bg-blue-50 rounded-lg'>
                                <div className='text-2xl font-bold text-blue-600'>
                                    ~15-20min
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Estimated Runtime
                                </div>
                            </div>
                            <div className='text-center p-4 bg-green-50 rounded-lg'>
                                <div className='text-2xl font-bold text-green-600'>
                                    Test + Prod
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Deployment Stages
                                </div>
                            </div>
                        </div>
                        <div className='mt-4 flex flex-wrap gap-2'>
                            <span className='inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full'>
                                CPI
                            </span>
                            <span className='inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full'>
                                API Management
                            </span>
                            <span className='inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full'>
                                Integration Flows
                            </span>
                            <span className='inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full'>
                                Blue-Green Deployment
                            </span>
                        </div>
                    </div>

                    {/* Pipeline Flow */}
                    <div className='mb-8'>
                        <h2 className='text-xl font-bold text-gray-900 mb-6'>
                            Pipeline Flow
                        </h2>
                        <div className='relative'>
                            {/* Pipeline Steps */}
                            <div className='space-y-6'>
                                {integrationSuitePipeline.map((step, index) => (
                                    <div key={step.id} className='relative'>
                                        {/* Connection Line */}
                                        {index <
                                            integrationSuitePipeline.length -
                                                1 && (
                                            <div className='absolute left-6 top-12 w-0.5 h-8 bg-gray-300 z-0'></div>
                                        )}

                                        {/* Step Card */}
                                        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative z-10'>
                                            <div className='flex items-start space-x-4'>
                                                {/* Step Icon */}
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

                                                {/* Step Content */}
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

                                                    {/* Step Configuration */}
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

                    {/* Template Features */}
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                        <h2 className='text-xl font-bold text-gray-900 mb-6'>
                            Template Features
                        </h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <div className='text-center'>
                                <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <svg
                                        className='w-6 h-6 text-orange-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M13 10V3L4 14h7v7l9-11h-7z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    CPI Integration
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Native support for Cloud Platform
                                    Integration flows and artifacts
                                </p>
                            </div>
                            <div className='text-center'>
                                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <svg
                                        className='w-6 h-6 text-blue-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    Automated Testing
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Comprehensive testing including integration
                                    and API endpoint validation
                                </p>
                            </div>
                            <div className='text-center'>
                                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <svg
                                        className='w-6 h-6 text-green-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    Blue-Green Deployment
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Zero-downtime deployments with automatic
                                    rollback capabilities
                                </p>
                            </div>
                            <div className='text-center'>
                                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <svg
                                        className='w-6 h-6 text-purple-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    Approval Gates
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Manual approval process for production
                                    deployments with stakeholder notifications
                                </p>
                            </div>
                            <div className='text-center'>
                                <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <svg
                                        className='w-6 h-6 text-indigo-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    Monitoring & Alerts
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Real-time monitoring with Slack and email
                                    notifications for issues
                                </p>
                            </div>
                            <div className='text-center'>
                                <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <svg
                                        className='w-6 h-6 text-yellow-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    Customizable
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Easily modify steps, add custom validations,
                                    or integrate with other tools
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
