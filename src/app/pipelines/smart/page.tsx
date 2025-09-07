'use client';

import {useState} from 'react';

interface ProjectType {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

const projectTypes: ProjectType[] = [
    {
        id: 'web-app',
        name: 'Web Application',
        description: 'Frontend applications (React, Vue, Angular)',
        icon: 'web',
        color: 'bg-blue-500',
    },
    {
        id: 'api-service',
        name: 'API/Microservice',
        description: 'Backend services and REST APIs',
        icon: 'api',
        color: 'bg-green-500',
    },
    {
        id: 'mobile-app',
        name: 'Mobile Application',
        description: 'Native and hybrid mobile apps',
        icon: 'mobile',
        color: 'bg-purple-500',
    },
    {
        id: 'sap-extension',
        name: 'SAP Extension',
        description: 'SAP S/4HANA, BTP, and Fiori applications',
        icon: 'sap',
        color: 'bg-blue-600',
    },
    {
        id: 'data-pipeline',
        name: 'Data Pipeline',
        description: 'ETL, data processing, and analytics',
        icon: 'data',
        color: 'bg-orange-500',
    },
    {
        id: 'infrastructure',
        name: 'Infrastructure',
        description: 'Terraform, CloudFormation, and IaC',
        icon: 'infrastructure',
        color: 'bg-gray-600',
    },
];

export default function SmartPipeline() {
    const [selectedProjectType, setSelectedProjectType] = useState<string>('');
    const [projectDetails, setProjectDetails] = useState({
        name: '',
        repository: '',
        framework: '',
        deployment: '',
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!selectedProjectType || !projectDetails.name) {
            alert('Please select a project type and enter a project name');
            return;
        }

        setIsGenerating(true);
        // Simulate AI pipeline generation
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setIsGenerating(false);

        // Here you would typically redirect to the generated pipeline or show results
        alert(
            'Smart Pipeline generated successfully! Redirecting to Pipeline Canvas...',
        );
    };

    return (
        <div className='h-full bg-sap-light-gray overflow-auto'>
            {/* Header */}
            <div className='bg-white border-b border-sap-border px-6 py-6 sticky top-0 z-10'>
                <div className='max-w-4xl mx-auto'>
                    <div className='text-center'>
                        <div className='flex items-center justify-center mb-4'>
                            <div className='w-12 h-12 bg-sap-green rounded-xl flex items-center justify-center mr-4'>
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
                                        d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                                    />
                                </svg>
                            </div>
                            <h1 className='text-3xl font-bold text-sap-dark-blue'>
                                SAP Smart Pipeline Generator
                            </h1>
                        </div>
                        <p className='text-sap-gray mt-2 max-w-2xl mx-auto'>
                            Tell us about your project and our AI will
                            automatically generate an optimized CI/CD pipeline
                            with best practices, intelligent configurations, and
                            recommended tools.
                        </p>
                    </div>
                </div>
            </div>

            <div className='p-6'>
                <div className='max-w-4xl mx-auto'>
                    {/* Step 1: Project Type Selection */}
                    <div className='mb-10'>
                        <h2 className='text-2xl font-bold text-sap-dark-blue mb-6'>
                            Step 1: Select Your Project Type
                        </h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {projectTypes.map((type) => (
                                <div
                                    key={type.id}
                                    className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 ${
                                        selectedProjectType === type.id
                                            ? 'border-sap-blue bg-sap-light-blue shadow-lg'
                                            : 'border-sap-border bg-white hover:border-sap-gray hover:shadow-md'
                                    }`}
                                    onClick={() =>
                                        setSelectedProjectType(type.id)
                                    }
                                >
                                    <div className='flex items-center mb-3'>
                                        <div
                                            className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center mr-3`}
                                        >
                                            <svg
                                                className='w-5 h-5 text-white'
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
                                        <h3 className='font-semibold text-gray-900'>
                                            {type.name}
                                        </h3>
                                    </div>
                                    <p className='text-sm text-gray-600'>
                                        {type.description}
                                    </p>
                                    {selectedProjectType === type.id && (
                                        <div className='mt-3 flex items-center text-emerald-600'>
                                            <svg
                                                className='w-4 h-4 mr-2'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M5 13l4 4L19 7'
                                                />
                                            </svg>
                                            <span className='text-sm font-medium'>
                                                Selected
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Project Details */}
                    {selectedProjectType && (
                        <div className='mb-10'>
                            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                                Step 2: Project Details
                            </h2>
                            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Project Name *
                                        </label>
                                        <input
                                            type='text'
                                            value={projectDetails.name}
                                            onChange={(e) =>
                                                setProjectDetails({
                                                    ...projectDetails,
                                                    name: e.target.value,
                                                })
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                            placeholder='Enter your project name'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Repository URL
                                        </label>
                                        <input
                                            type='text'
                                            value={projectDetails.repository}
                                            onChange={(e) =>
                                                setProjectDetails({
                                                    ...projectDetails,
                                                    repository: e.target.value,
                                                })
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                            placeholder='https://github.com/username/repo'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Framework/Technology
                                        </label>
                                        <select
                                            value={projectDetails.framework}
                                            onChange={(e) =>
                                                setProjectDetails({
                                                    ...projectDetails,
                                                    framework: e.target.value,
                                                })
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                        >
                                            <option value=''>
                                                Select framework
                                            </option>
                                            <option value='react'>React</option>
                                            <option value='vue'>Vue.js</option>
                                            <option value='angular'>
                                                Angular
                                            </option>
                                            <option value='node'>
                                                Node.js
                                            </option>
                                            <option value='python'>
                                                Python
                                            </option>
                                            <option value='java'>Java</option>
                                            <option value='dotnet'>.NET</option>
                                            <option value='sap-cap'>
                                                SAP CAP
                                            </option>
                                            <option value='sap-ui5'>
                                                SAP UI5
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Deployment Target
                                        </label>
                                        <select
                                            value={projectDetails.deployment}
                                            onChange={(e) =>
                                                setProjectDetails({
                                                    ...projectDetails,
                                                    deployment: e.target.value,
                                                })
                                            }
                                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                        >
                                            <option value=''>
                                                Select deployment target
                                            </option>
                                            <option value='aws'>AWS</option>
                                            <option value='azure'>
                                                Microsoft Azure
                                            </option>
                                            <option value='gcp'>
                                                Google Cloud
                                            </option>
                                            <option value='kubernetes'>
                                                Kubernetes
                                            </option>
                                            <option value='sap-btp'>
                                                SAP BTP
                                            </option>
                                            <option value='docker'>
                                                Docker
                                            </option>
                                            <option value='vercel'>
                                                Vercel
                                            </option>
                                            <option value='netlify'>
                                                Netlify
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    {selectedProjectType && projectDetails.name && (
                        <div className='text-center'>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={`px-8 py-4 text-lg font-medium text-white rounded-xl shadow-lg transition-all duration-200 ${
                                    isGenerating
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl'
                                }`}
                            >
                                {isGenerating ? (
                                    <div className='flex items-center'>
                                        <svg
                                            className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                                            xmlns='http://www.w3.org/2000/svg'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                        >
                                            <circle
                                                className='opacity-25'
                                                cx='12'
                                                cy='12'
                                                r='10'
                                                stroke='currentColor'
                                                strokeWidth='4'
                                            ></circle>
                                            <path
                                                className='opacity-75'
                                                fill='currentColor'
                                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                            ></path>
                                        </svg>
                                        Generating Smart Pipeline...
                                    </div>
                                ) : (
                                    'Generate Smart Pipeline'
                                )}
                            </button>

                            {!isGenerating && (
                                <p className='text-gray-600 mt-4 text-sm'>
                                    Our AI will analyze your project
                                    requirements and create an optimized
                                    pipeline
                                </p>
                            )}
                        </div>
                    )}

                    {/* AI Features Info */}
                    <div className='mt-12 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8'>
                        <h3 className='text-xl font-bold text-gray-900 mb-4 text-center'>
                            What makes our Smart Pipeline intelligent?
                        </h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                            <div className='text-center'>
                                <div className='w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3'>
                                    <svg
                                        className='w-6 h-6 text-emerald-600'
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
                                <h4 className='font-semibold text-gray-900 mb-2'>
                                    Smart Detection
                                </h4>
                                <p className='text-sm text-gray-600'>
                                    Automatically detects project structure and
                                    dependencies
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
                                <h4 className='font-semibold text-gray-900 mb-2'>
                                    Best Practices
                                </h4>
                                <p className='text-sm text-gray-600'>
                                    Implements industry-standard CI/CD best
                                    practices
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
                                            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                                        />
                                    </svg>
                                </div>
                                <h4 className='font-semibold text-gray-900 mb-2'>
                                    Auto-Optimization
                                </h4>
                                <p className='text-sm text-gray-600'>
                                    Optimizes build times and resource usage
                                </p>
                            </div>
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
                                            d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                                        />
                                    </svg>
                                </div>
                                <h4 className='font-semibold text-gray-900 mb-2'>
                                    Customizable
                                </h4>
                                <p className='text-sm text-gray-600'>
                                    Generates pipelines you can further
                                    customize
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
