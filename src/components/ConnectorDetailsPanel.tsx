'use client';

import React, {useState} from 'react';
import {XMarkIcon} from '@heroicons/react/24/outline';

interface ConnectorDetailsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sidebarWidth?: number; // Width of the main sidebar
    connector: {
        id: string;
        name: string;
        icon: React.ReactNode;
        description?: string;
    } | null;
}

// Field type definition
interface ConnectorField {
    label: string;
    type: string;
    required?: boolean;
    value?: string;
    placeholder?: string;
    options?: string[];
}

// Background illustration for the connector
const ConnectorBg = ({connectorType}: {connectorType: string}) => {
    if (connectorType === 'jira') {
        return (
            <svg
                viewBox='0 0 128 128'
                className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
            >
                <defs>
                    <linearGradient id='jira-bg' x1='0' y1='0' x2='1' y2='1'>
                        <stop
                            offset='0%'
                            stopColor='#0052CC'
                            stopOpacity='0.25'
                        />
                        <stop
                            offset='100%'
                            stopColor='#2684FF'
                            stopOpacity='0.08'
                        />
                    </linearGradient>
                </defs>
                <g fill='url(#jira-bg)'>
                    <rect x='20' y='20' width='88' height='88' rx='16' />
                    <rect x='32' y='32' width='64' height='8' rx='4' />
                    <rect x='32' y='48' width='48' height='8' rx='4' />
                    <rect x='32' y='64' width='56' height='8' rx='4' />
                    <rect x='32' y='80' width='40' height='8' rx='4' />
                </g>
            </svg>
        );
    }

    // Default connector background
    return (
        <svg
            viewBox='0 0 128 128'
            className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
        >
            <defs>
                <linearGradient id='connector-bg' x1='0' y1='0' x2='1' y2='1'>
                    <stop offset='0%' stopColor='#60A5FA' stopOpacity='0.25' />
                    <stop
                        offset='100%'
                        stopColor='#A78BFA'
                        stopOpacity='0.08'
                    />
                </linearGradient>
            </defs>
            <g fill='url(#connector-bg)'>
                <circle cx='64' cy='64' r='48' />
                <circle
                    cx='64'
                    cy='64'
                    r='32'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='4'
                    opacity='0.3'
                />
                <circle
                    cx='64'
                    cy='64'
                    r='16'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='4'
                    opacity='0.5'
                />
            </g>
        </svg>
    );
};

// Configuration steps for different connectors
const getConnectorSteps = (connectorType: string) => {
    switch (connectorType) {
        case 'jira':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'JSFConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'Jira Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'JIRAConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'Jira URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'github':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'GitHubConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'GitHub Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'GitHubConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'GitHub URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'gitlab':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'GitLabConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'GitLab Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'GitLabConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'GitLab URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'jenkins':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'JenkinsConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'Jenkins Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'JenkinsConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'Jenkins URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'docker':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'DockerConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'Docker Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'DockerConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'Registry URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'aws':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'AWSConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'AWS Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'AWSConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'AWS Region',
                            type: 'select',
                            options: [
                                'us-east-1',
                                'us-west-2',
                                'eu-west-1',
                                'ap-southeast-1',
                            ],
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'trello':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'TrelloConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'Trello Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'TrelloConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'Trello API URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'asana':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'AsanaConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'Asana Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'AsanaConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'Asana API URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'kubernetes':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'K8sConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'Kubernetes Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'K8sConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'Cluster Endpoint',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'slack':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'SlackConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'Slack Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'SlackConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'Webhook URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        case 'teams':
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information and settings',
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            value: 'TeamsConn',
                            required: true,
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            value: 'Microsoft Teams Connector',
                        },
                        {label: 'Tags', type: 'text', value: 'TeamsConnTag'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'Teams Webhook URL',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
        default:
            return [
                {
                    step: 1,
                    title: 'Overview',
                    description: 'Basic connector information',
                    fields: [
                        {label: 'Name', type: 'text', required: true},
                        {label: 'Description', type: 'text'},
                        {label: 'Tags', type: 'text'},
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Authentication and connection details',
                    fields: [
                        {
                            label: 'API Endpoint',
                            type: 'url',
                            placeholder: 'Type here',
                            required: true,
                        },
                        {
                            label: 'Credential Name',
                            type: 'text',
                            placeholder: 'Type here',
                            required: true,
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 3,
                    title: 'Connection Test',
                    description: 'Test the connection and validate settings',
                    fields: [] as ConnectorField[],
                },
            ];
    }
};

export default function ConnectorDetailsPanel({
    isOpen,
    onClose,
    sidebarWidth = 256,
    connector,
}: ConnectorDetailsPanelProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Record<string, string>>({});

    if (!connector) return null;

    const steps = getConnectorSteps(connector.id);
    const currentStepData = steps.find((s) => s.step === currentStep);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({...prev, [field]: value}));
    };

    const handleSaveAndContinue = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            // Final save
            console.log('Saving connector configuration:', formData);
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop - covers entire screen */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
                    isOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Connector Details Panel - Progressive sliding from right to left */}
            <div
                className={`fixed top-0 right-0 h-full bg-white shadow-2xl transform transition-all duration-300 ease-in-out z-50 border-l border-slate-200 flex ${
                    isOpen
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 pointer-events-none'
                }`}
                style={{
                    width: '550px', // Further reduced width for maximum compactness
                }}
                aria-hidden={!isOpen}
            >
                {/* Left Sidebar Navigation */}
                <div
                    className='w-56 flex flex-col relative'
                    style={{
                        backgroundColor: '#0a1a2f',
                        backgroundImage: 'url(/images/logos/sidebar.png)',
                        backgroundSize: 'contain',
                        backgroundPosition: 'center bottom',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Header with Logo and Title */}
                    <div className='p-6 border-b border-blue-700'>
                        <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 flex items-center justify-center bg-blue-600 rounded-lg'>
                                {connector.icon}
                            </div>
                            <div>
                                <h2 className='text-white font-semibold text-lg'>
                                    {connector.name}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Steps Navigation */}
                    <div className='flex-1 p-6'>
                        <div className='space-y-6'>
                            {steps.map((step, index) => (
                                <div key={step.step} className='relative'>
                                    {/* Connecting Line */}
                                    {index < steps.length - 1 && (
                                        <div className='absolute left-4 top-12 w-0.5 h-16 bg-blue-600'></div>
                                    )}

                                    <div
                                        className={`flex items-start space-x-4 cursor-pointer transition-all duration-200 ${
                                            step.step === currentStep
                                                ? 'text-white'
                                                : step.step < currentStep
                                                ? 'text-blue-200'
                                                : 'text-blue-400'
                                        }`}
                                        onClick={() =>
                                            setCurrentStep(step.step)
                                        }
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                                                step.step === currentStep
                                                    ? 'bg-blue-500 text-white border-blue-400'
                                                    : step.step < currentStep
                                                    ? 'bg-blue-600 text-white border-blue-500'
                                                    : 'bg-transparent text-blue-400 border-blue-600'
                                            }`}
                                        >
                                            {step.step < currentStep ? (
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
                                            ) : (
                                                step.step
                                            )}
                                        </div>
                                        <div className='flex-1'>
                                            <div className='text-xs font-medium uppercase tracking-wider opacity-75'>
                                                STEP {step.step}
                                            </div>
                                            <div className='text-base font-semibold mt-1'>
                                                {step.title}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className='absolute bottom-0 left-0 w-full h-32 opacity-10'>
                        <ConnectorBg connectorType={connector.id} />
                    </div>
                </div>

                {/* Right Content Area */}
                <div className='flex-1 flex flex-col bg-white'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-6 border-b border-slate-200'>
                        <div>
                            <h3 className='text-2xl font-semibold text-slate-800'>
                                {currentStepData?.title}
                            </h3>
                            <p className='text-slate-600 mt-1'>
                                {currentStepData?.description}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group'
                        >
                            <XMarkIcon className='w-6 h-6 text-slate-600 group-hover:text-red-600 transition-colors duration-200' />
                        </button>
                    </div>

                    {/* Content */}
                    <div className='flex-1 overflow-y-auto p-6'>
                        {currentStepData && (
                            <div className='space-y-6 max-w-2xl'>
                                {/* Step-specific content */}
                                {currentStep === 3 ? (
                                    // Connection Test Step
                                    <div className='space-y-6'>
                                        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                                            <div className='flex items-center space-x-3'>
                                                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                                                    <svg
                                                        className='w-4 h-4 text-blue-600'
                                                        fill='currentColor'
                                                        viewBox='0 0 20 20'
                                                    >
                                                        <path
                                                            fillRule='evenodd'
                                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                                            clipRule='evenodd'
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className='font-medium text-blue-800'>
                                                        Ready to Test Connection
                                                    </h4>
                                                    <p className='text-sm text-blue-600'>
                                                        Click the button below
                                                        to test your
                                                        configuration
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <button className='w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium'>
                                            Test Connection
                                        </button>
                                    </div>
                                ) : (
                                    // Form Fields
                                    <div className='space-y-6'>
                                        {currentStepData.fields.map(
                                            (field, index) => (
                                                <div key={index}>
                                                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                                                        {field.label}{' '}
                                                        {field.required && (
                                                            <span className='text-red-500'>
                                                                *
                                                            </span>
                                                        )}
                                                    </label>
                                                    {field.type === 'select' ? (
                                                        <select
                                                            className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base'
                                                            value={
                                                                formData[
                                                                    field.label
                                                                ] || ''
                                                            }
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    field.label,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            <option value=''>
                                                                Select an option
                                                            </option>
                                                            {field.options?.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option
                                                                        }
                                                                        value={
                                                                            option
                                                                        }
                                                                    >
                                                                        {option}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    ) : field.type ===
                                                      'textarea' ? (
                                                        <textarea
                                                            className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base'
                                                            placeholder={
                                                                field.placeholder
                                                            }
                                                            value={
                                                                formData[
                                                                    field.label
                                                                ] ||
                                                                field.value ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    field.label,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            rows={4}
                                                        />
                                                    ) : (
                                                        <input
                                                            type={field.type}
                                                            className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base'
                                                            placeholder={
                                                                field.placeholder
                                                            }
                                                            value={
                                                                formData[
                                                                    field.label
                                                                ] ||
                                                                field.value ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                handleInputChange(
                                                                    field.label,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className='p-6 border-t border-slate-200 bg-slate-50/50'>
                        <div className='flex justify-between items-center'>
                            <div className='text-sm text-slate-500'>
                                Step {currentStep} of {steps.length}
                            </div>
                            <div className='flex space-x-3'>
                                {currentStep > 1 && (
                                    <button
                                        onClick={() =>
                                            setCurrentStep(currentStep - 1)
                                        }
                                        className='px-6 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200'
                                    >
                                        Previous
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveAndContinue}
                                    className='px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium'
                                >
                                    {currentStep === steps.length
                                        ? 'Save & Continue'
                                        : 'Next'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
