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

const sapS4HanaExtensionPipeline: PipelineStep[] = [
    {
        id: 'source',
        title: 'Source Code',
        description: 'Pull CAP application code from Git repository',
        type: 'source',
        icon: 'git',
        config: {
            repository: 'https://github.com/your-org/s4hana-extension',
            branch: 'main',
            triggers: ['push', 'pull_request'],
        },
    },
    {
        id: 'install-deps',
        title: 'Install Dependencies',
        description: 'Install Node.js dependencies and CAP tools',
        type: 'build',
        icon: 'install',
        config: {
            nodeVersion: '18.x',
            commands: ['npm install', 'npm install -g @sap/cds-dk'],
            cacheEnabled: true,
        },
    },
    {
        id: 'lint-test',
        title: 'Code Quality & Unit Tests',
        description: 'Run ESLint, security scans, and unit tests',
        type: 'test',
        icon: 'test',
        config: {
            linting: ['ESLint', 'Prettier'],
            security: ['npm audit', 'Snyk scan'],
            unitTests: ['Jest', 'CAP test framework'],
        },
    },
    {
        id: 'build-cap',
        title: 'Build CAP Application',
        description: 'Build CAP service and UI components',
        type: 'build',
        icon: 'build',
        config: {
            buildCommands: ['cds build', 'npm run build:ui'],
            artifacts: ['srv/', 'app/', 'db/'],
            optimization: 'Production build',
        },
    },
    {
        id: 'deploy-dev',
        title: 'Deploy to Development',
        description: 'Deploy to SAP BTP development subaccount',
        type: 'deploy',
        icon: 'dev-deploy',
        config: {
            environment: 'Development',
            subaccount: 'dev-subaccount',
            services: ['SAP HANA Cloud', 'Destination Service', 'XSUAA'],
        },
    },
    {
        id: 'integration-test',
        title: 'Integration Tests',
        description: 'Test S/4HANA API connectivity and data flows',
        type: 'test',
        icon: 'integration-test',
        config: {
            tests: [
                'S/4HANA API tests',
                'OData service tests',
                'UI5 E2E tests',
            ],
            tools: ['Postman', 'WebDriverIO', 'OPA5'],
        },
    },
    {
        id: 'approval',
        title: 'Production Approval',
        description: 'Manual approval for production deployment',
        type: 'approval',
        icon: 'approval',
        config: {
            approvers: ['Product Owner', 'SAP Architect'],
            criteria: [
                'Integration tests passed',
                'Performance review completed',
            ],
        },
    },
    {
        id: 'deploy-prod',
        title: 'Deploy to Production',
        description: 'Deploy to SAP BTP production subaccount',
        type: 'deploy',
        icon: 'prod-deploy',
        config: {
            environment: 'Production',
            subaccount: 'prod-subaccount',
            strategy: 'Blue-Green with database migration',
            monitoring: 'Application Performance Monitoring enabled',
        },
    },
];

const getStepIcon = (icon: string) => {
    const iconMap: {[key: string]: string} = {
        git: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />`,
        install: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />`,
        test: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
        build: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />`,
        'dev-deploy': `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h9m-9 0a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />`,
        'integration-test': `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />`,
        approval: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />`,
        'prod-deploy': `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />`,
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

export default function SAPS4HanaExtensionTemplate() {
    return (
        <div className='h-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 overflow-auto'>
            {/* Header */}
            <div className='bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-6 sticky top-0 z-10'>
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
                                <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4'>
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
                                            d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className='text-3xl font-bold text-gray-900'>
                                        SAP S/4HANA Extension Pipeline
                                    </h1>
                                    <p className='text-gray-600 mt-1'>
                                        CI/CD pipeline for SAP S/4HANA Cloud
                                        extensions with CAP framework and BTP
                                        deployment
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='flex space-x-3'>
                            <Link
                                href='/pipelines/canvas?template=sap-s4hana-extension'
                                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                            >
                                Customize in Canvas
                            </Link>
                            <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'>
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
                            <div className='text-center p-4 bg-blue-50 rounded-lg'>
                                <div className='text-2xl font-bold text-blue-600'>
                                    8
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Pipeline Steps
                                </div>
                            </div>
                            <div className='text-center p-4 bg-green-50 rounded-lg'>
                                <div className='text-2xl font-bold text-green-600'>
                                    ~12-18min
                                </div>
                                <div className='text-sm text-gray-600'>
                                    Estimated Runtime
                                </div>
                            </div>
                            <div className='text-center p-4 bg-purple-50 rounded-lg'>
                                <div className='text-2xl font-bold text-purple-600'>
                                    CAP + BTP
                                </div>
                                <div className='text-sm text-gray-600'>
                                    SAP Technology Stack
                                </div>
                            </div>
                        </div>
                        <div className='mt-4 flex flex-wrap gap-2'>
                            <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                                SAP CAP
                            </span>
                            <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                                SAP BTP
                            </span>
                            <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                                S/4HANA Cloud
                            </span>
                            <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                                Node.js
                            </span>
                            <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                                HANA Cloud
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
                                {sapS4HanaExtensionPipeline.map(
                                    (step, index) => (
                                        <div key={step.id} className='relative'>
                                            {index <
                                                sapS4HanaExtensionPipeline.length -
                                                    1 && (
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
                                                                Step {index + 1}
                                                                : {step.title}
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
                                    ),
                                )}
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
                                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <span className='text-blue-600 font-bold text-sm'>
                                        CAP
                                    </span>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    SAP CAP Framework
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Full support for SAP Cloud Application
                                    Programming model with CDS builds
                                </p>
                            </div>
                            <div className='text-center'>
                                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <span className='text-green-600 font-bold text-sm'>
                                        BTP
                                    </span>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    SAP BTP Integration
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Seamless deployment to SAP Business
                                    Technology Platform with service bindings
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
                                            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                    S/4HANA Connectivity
                                </h3>
                                <p className='text-sm text-gray-600'>
                                    Pre-configured to test connectivity and data
                                    flows with S/4HANA Cloud APIs
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
