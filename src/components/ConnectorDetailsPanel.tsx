'use client';

import React, {useState} from 'react';
import {XMarkIcon, InformationCircleIcon} from '@heroicons/react/24/outline';

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
    help?: string;
}

interface ConnectorStep {
    step: number;
    title: string;
    description: string;
    help?: {
        title: string;
        content: string;
        note?: string;
        sections?: Array<{
            title: string;
            content: string | string[];
        }>;
    };
    fields?: ConnectorField[];
    getFields?: (formData: Record<string, string>) => ConnectorField[];
    showValidation?: boolean;
}

type ConnectorStepType = {
    step: number;
    title: string;
    description: string;
    help?: {
        title: string;
        content: string;
        note?: string;
        sections?: Array<{
            title: string;
            content: string | string[];
        }>;
    };
    fields?: ConnectorField[];
    getFields?: (formData: Record<string, string>) => ConnectorField[];
    showValidation?: boolean;
};

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
// Success notification component
const SuccessNotification = ({message}: {message: string}) => (
    <div className='fixed top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slideIn'>
        <svg
            className='w-5 h-5 text-emerald-500'
            fill='currentColor'
            viewBox='0 0 20 20'
        >
            <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
            />
        </svg>
        {message}
    </div>
);

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
                    help: {
                        title: 'What is the Git connector?',
                        content:
                            'The Harness Git connector is a platform-agnostic connector that you can use to connect to any Git account or repo. Learn more',
                        note: "Whenever possible, you should use the platform-specific code repo connectors, such as the GitHub connector or GitLab connector. Use the Git connector only if Harness doesn't have a platform-specific connector for your SCM provider.",
                    },
                    fields: [
                        {
                            label: 'Name',
                            type: 'text',
                            required: true,
                            help: 'Enter a name that identifies this connector',
                        },
                        {
                            label: 'Description',
                            type: 'text',
                            optional: true,
                            help: 'Brief description of the connector',
                        },
                        {
                            label: 'Tags',
                            type: 'text',
                            optional: true,
                            help: 'Add tags to organize and categorize this connector',
                        },
                    ] as ConnectorField[],
                },
                {
                    step: 2,
                    title: 'Details',
                    description: 'Connection and authentication details',
                    getFields: (formData: Record<string, string>) => {
                        const urlType = formData['URL Type'] || 'Account';
                        const isSSH = formData['Connection Type'] === 'SSH';

                        return [
                            {
                                label: 'URL Type',
                                type: 'radio',
                                options: ['Account', 'Repository'],
                                required: true,
                                help: 'Enter the URL for the GitHub account or repository that you want to connect to.\n\nGitHub Repository URL: Enter the complete URL to the GitHub repository, such as https://github.com/YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git or git@github.com:YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git.\n\nGitHub Account URL: only the account-identifying portion of the GitHub URL, such as https://github.com/YOUR_ACCOUNT_NAME/, https://github.com, git@github.com:YOUR_ACCOUNT_NAME/, or git@github.com. Do not include a repo name.',
                                value: urlType,
                            },
                            {
                                label: 'Connection Type',
                                type: 'radio',
                                options: ['HTTP', 'SSH'],
                                required: true,
                                help: 'Choose how to authenticate with GitHub:\n\nHTTP: Use username and personal access token (PAT)\nSSH: Use SSH key authentication',
                                value: formData['Connection Type'] || 'HTTP',
                            },
                            ...(urlType === 'Account'
                                ? [
                                      {
                                          label: 'GitHub Account URL',
                                          type: 'text',
                                          placeholder: isSSH
                                              ? 'git@github.com'
                                              : 'https://github.com',
                                          required: true,
                                          help: 'Enter your GitHub account URL',
                                          value:
                                              formData['GitHub Account URL'] ||
                                              '',
                                      },
                                      {
                                          label: 'Test Repository',
                                          type: 'text',
                                          placeholder: '',
                                          required: true,
                                          help: 'Please provide a repository to test the credentials. This is required just for checking connectivity. The connector will still be created at account level.',
                                          value:
                                              formData['Test Repository'] || '',
                                      },
                                  ]
                                : [
                                      {
                                          label: 'GitHub Repository URL',
                                          type: 'text',
                                          placeholder: isSSH
                                              ? 'git@github.com:YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git'
                                              : 'https://github.com/YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git',
                                          required: true,
                                          help: isSSH
                                              ? 'Enter the SSH URL in the format: git@github.com:ACCOUNT/REPO.git'
                                              : 'Enter the complete URL to the GitHub repository',
                                          value:
                                              formData[
                                                  'GitHub Repository URL'
                                              ] || '',
                                      },
                                  ]),
                        ];
                    },
                },
                {
                    step: 3,
                    title: 'Credentials',
                    description: 'Authentication credentials',
                    help: {
                        title: 'How do I authenticate with Git?',
                        content:
                            'For SSH connections, you must use SSH key authentication.',
                        sections: [
                            {
                                title: 'SSH Key',
                                content:
                                    'Enter your SSH private key or select a secret containing the key.',
                            },
                        ],
                    },
                    getFields: (formData: Record<string, string>) => {
                        const isSSH = formData['Connection Type'] === 'SSH';
                        const baseFields = [
                            {
                                label: 'Enable API access (recommended)',
                                type: 'checkbox',
                                help: 'API Access is required for using "Git Experience", for creation of Git based triggers, Webhooks management and updating Git statuses',
                                value:
                                    formData[
                                        'Enable API access (recommended)'
                                    ] || false,
                            },
                        ];

                        if (isSSH) {
                            return [
                                {
                                    label: 'Authentication',
                                    type: 'label',
                                    value: 'SSH Key',
                                    required: true,
                                },
                                {
                                    label: 'SSH Key',
                                    type: 'secret',
                                    placeholder: 'Create or Select a Secret',
                                    required: true,
                                    help: 'Enter your SSH private key or select a secret containing the key',
                                    value: formData['SSH Key'] || '',
                                },
                                ...baseFields,
                            ] as ConnectorField[];
                        }

                        return [
                            {
                                label: 'Authentication',
                                type: 'select',
                                options: ['Username and Token'],
                                required: true,
                                help: 'Select authentication method',
                                value:
                                    formData['Authentication'] ||
                                    'Username and Token',
                            },
                            {
                                label: 'Username',
                                type: 'text',
                                placeholder: 'Enter your GitHub username',
                                required: true,
                                help: 'Enter your GitHub username',
                                value: formData['Username'] || '',
                            },
                            {
                                label: 'Personal Access Token',
                                type: 'secret',
                                placeholder: 'Create or Select a Secret',
                                required: true,
                                help: 'Enter your GitHub personal access token',
                                value: formData['Personal Access Token'] || '',
                            },
                            ...baseFields,
                        ] as ConnectorField[];
                    },
                },
                {
                    step: 4,
                    title: 'Connection Test',
                    description: 'Validate Git authentication and permissions',
                    help: {
                        title: 'Connector Test',
                        content:
                            'Harness uses a delegate to test the connector by establishing network connectivity and authentication.',
                        sections: [
                            {
                                title: 'Network Connectivity',
                                content:
                                    'Network connectivity ensures that a Harness delegate can reach the target resource.',
                            },
                            {
                                title: 'The delegate needs',
                                content: [
                                    'API/SSH/HTTPS access to the resources required by this connector.',
                                    'HTTPS port 443 outbound from the delegate to Harness.',
                                    'HTTP/2 for gRPC (gRPC Remote Procedure Calls).',
                                ],
                            },
                        ],
                    },
                    fields: [] as ConnectorField[],
                    showValidation: true,
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

// Add keyframe animations for the step indicators
const styles = `
    @keyframes checkmark {
        0% {
            transform: scale(0.8);
            opacity: 0;
        }
        50% {
            transform: scale(1.2);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 0.5;
        }
        50% {
            transform: scale(1.1);
            opacity: 0.2;
        }
        100% {
            transform: scale(1);
            opacity: 0.5;
        }
    }

    @keyframes slideIn {
        0% {
            transform: translateX(100%);
            opacity: 0;
        }
        100% {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

// Add styles to the document
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

export default function ConnectorDetailsPanel({
    isOpen,
    onClose,
    sidebarWidth = 256,
    connector,
}: ConnectorDetailsPanelProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isValidating, setIsValidating] = useState(false);
    const [showSuccessNotification, setShowSuccessNotification] =
        useState(false);
    const [validationProgress, setValidationProgress] = useState(0);
    const [validationError, setValidationError] = useState<{
        title: string;
        message: string;
        details?: string;
    } | null>(null);

    // Function to test connection with actual credentials
    const validateConnection = async () => {
        console.log('Starting validation...');
        setIsValidating(true);
        setValidationProgress(0);
        setValidationError(null);
        setShowSuccessNotification(false);

        try {
            // Start validation
            setValidationProgress(20);
            console.log('Progress: 20%');

            // Get URL and credentials based on connection type
            const isSSH = formData['Connection Type'] === 'SSH';
            const isAccount = formData['URL Type'] === 'Account';
            const url = isAccount
                ? formData['GitHub Account URL']
                : formData['GitHub Repository URL'];

            console.log('Form data:', formData);
            setValidationProgress(40);
            console.log('Progress: 40%');

            // Validate credentials
            let success = false;
            try {
                const requestData = {
                    type: isSSH ? 'ssh' : 'http',
                    url: url,
                    ...(isSSH
                        ? {
                              sshKey: formData['SSH Key'],
                          }
                        : {
                              username: formData['Username'],
                              token: formData['Personal Access Token'],
                          }),
                    enableApi: formData['Enable API access (recommended)'],
                };
                console.log('Sending connection test request:', requestData);

                const response = await fetch(
                    'http://localhost:4000/api/github/test-connection',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify(requestData),
                    },
                );

                const responseData = await response.json();
                console.log('Response from server:', responseData);

                if (!response.ok) {
                    throw responseData;
                }

                // Always set success state if we get here
                setValidationProgress(100);
                setShowSuccessNotification(true);
                success = true;
                console.log('Setting success notification to true');
                setTimeout(() => {
                    console.log('Hiding success notification');
                    setShowSuccessNotification(false);
                }, 3000);
            } catch (error: any) {
                console.error('Inner validation error:', error);
                setValidationError(error);
                setValidationProgress(0);
                setIsValidating(false);
                throw error; // Re-throw to be caught by outer catch
            }
        } catch (error: any) {
            console.error('Outer validation error:', error);
            setValidationError({
                title: error.title || 'Connection Failed',
                message: error.message || 'Failed to validate connection',
                details: error.details || JSON.stringify(error, null, 2),
            });
            setValidationProgress(0);
        } finally {
            console.log(
                'Validation complete. isValidating:',
                isValidating,
                'validationError:',
                validationError,
                'showSuccessNotification:',
                showSuccessNotification,
            );
            setIsValidating(false);
        }
    };

    if (!connector) return null;

    const steps = getConnectorSteps(connector.id) as ConnectorStepType[];
    const currentStepData = steps.find((s) => s.step === currentStep);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({...prev, [field]: value}));
    };

    const handleSaveAndContinue = async () => {
        if (currentStep < steps.length) {
            // Move to next step
            setCurrentStep(currentStep + 1);
        } else {
            // On the final step, close the panel
            onClose();
        }
    };

    return (
        <>
            {/* Success Notification */}
            {showSuccessNotification && (
                <div className='fixed top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slideIn'>
                    <svg
                        className='w-5 h-5 text-emerald-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                    >
                        <path
                            fillRule='evenodd'
                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                            clipRule='evenodd'
                        />
                    </svg>
                    GitHub connection successful!
                </div>
            )}

            {/* Backdrop - covers entire screen */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
                    isOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Connector Details Panel - Progressive sliding from right to left */}
            <div
                className={`fixed top-0 right-0 h-full bg-white shadow-2xl transform transition-all duration-300 ease-in-out z-50 flex ${
                    isOpen
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 pointer-events-none'
                }`}
                style={{
                    width: '800px', // Increased width for better readability
                }}
                aria-hidden={!isOpen}
            >
                {/* Left Sidebar Navigation */}
                <div
                    className='w-80 flex flex-col relative'
                    style={{
                        backgroundColor: '#0a1a2f',
                        backgroundImage: 'url(/images/logos/sidebar.png)',
                        backgroundSize: 'contain',
                        backgroundPosition: 'center bottom',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Header with Logo and Title */}
                    <div className='p-6 border-b border-opacity-20 border-white'>
                        <div className='flex items-center gap-3'>
                            <div className='w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300'>
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
                                            className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                                                step.step === currentStep
                                                    ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/30'
                                                    : step.step < currentStep
                                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30'
                                                    : 'bg-transparent text-blue-400 border-blue-600'
                                            }`}
                                        >
                                            {step.step < currentStep ? (
                                                <>
                                                    <svg
                                                        className='w-5 h-5 animate-[checkmark_0.4s_ease-in-out_forwards]'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={3}
                                                            d='M5 13l4 4L19 7'
                                                        >
                                                            <animate
                                                                attributeName='stroke-dasharray'
                                                                from='0 28 28'
                                                                to='28 28 28'
                                                                dur='0.4s'
                                                                fill='freeze'
                                                            />
                                                        </path>
                                                    </svg>
                                                    <div className='absolute inset-0 rounded-full border-2 border-emerald-400'>
                                                        <div className='absolute inset-0 rounded-full border-4 border-emerald-500 animate-[pulse_2s_ease-in-out_infinite]'></div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {step.step}
                                                    {step.step ===
                                                        currentStep && (
                                                        <div className='absolute inset-0 rounded-full border-2 border-blue-400'>
                                                            <div className='absolute inset-0 rounded-full border-4 border-blue-500 animate-[pulse_2s_ease-in-out_infinite]'></div>
                                                        </div>
                                                    )}
                                                </>
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
                                {currentStepData?.showValidation ? (
                                    // Connection Test Step with Validation
                                    <div className='space-y-6'>
                                        {/* URL Display */}
                                        <div className='text-sm text-slate-600'>
                                            <span className='font-medium'>
                                                URL:{' '}
                                            </span>
                                            {formData['URL Type'] === 'Account'
                                                ? formData['GitHub Account URL']
                                                : formData[
                                                      'GitHub Repository URL'
                                                  ]}
                                        </div>

                                        {/* Status Box */}
                                        <div
                                            className={`border rounded-lg p-4 ${
                                                validationError
                                                    ? 'bg-red-50 border-red-200'
                                                    : showSuccessNotification
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-blue-50 border-blue-200'
                                            }`}
                                        >
                                            <div className='flex items-center space-x-3'>
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                        validationError
                                                            ? 'bg-red-100'
                                                            : showSuccessNotification
                                                            ? 'bg-green-100'
                                                            : 'bg-blue-100'
                                                    }`}
                                                >
                                                    {isValidating ? (
                                                        <svg
                                                            className='w-5 h-5 text-blue-600 animate-spin'
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
                                                    ) : validationError ? (
                                                        <svg
                                                            className='w-5 h-5 text-red-600'
                                                            fill='none'
                                                            stroke='currentColor'
                                                            viewBox='0 0 24 24'
                                                        >
                                                            <path
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                                strokeWidth={2}
                                                                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                                            />
                                                        </svg>
                                                    ) : showSuccessNotification ? (
                                                        <svg
                                                            className='w-5 h-5 text-green-600'
                                                            fill='currentColor'
                                                            viewBox='0 0 20 20'
                                                        >
                                                            <path
                                                                fillRule='evenodd'
                                                                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                                                clipRule='evenodd'
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            className='w-5 h-5 text-blue-600'
                                                            fill='currentColor'
                                                            viewBox='0 0 20 20'
                                                        >
                                                            <path
                                                                fillRule='evenodd'
                                                                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                                                clipRule='evenodd'
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4
                                                        className={`font-medium ${
                                                            validationError
                                                                ? 'text-red-800'
                                                                : showSuccessNotification
                                                                ? 'text-green-800'
                                                                : 'text-blue-800'
                                                        }`}
                                                    >
                                                        {isValidating
                                                            ? 'Validating GitHub authentication and permissions'
                                                            : validationError
                                                            ? validationError.title
                                                            : showSuccessNotification
                                                            ? 'Connection Successful'
                                                            : 'Ready to Test Connection'}
                                                    </h4>
                                                    <p
                                                        className={`text-sm ${
                                                            validationError
                                                                ? 'text-red-600'
                                                                : showSuccessNotification
                                                                ? 'text-green-600'
                                                                : 'text-blue-600'
                                                        }`}
                                                    >
                                                        {isValidating
                                                            ? `Validating... ${validationProgress}%`
                                                            : validationError
                                                            ? validationError.message
                                                            : showSuccessNotification
                                                            ? 'GitHub connection validated successfully'
                                                            : 'Click the button below to test your configuration'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {isValidating && (
                                            <div className='w-full bg-gray-200 rounded-full h-2.5'>
                                                <div
                                                    className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
                                                    style={{
                                                        width: `${validationProgress}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        )}

                                        {/* Error Details */}
                                        {validationError?.details && (
                                            <div className='bg-slate-50 rounded-lg p-4 font-mono text-sm whitespace-pre overflow-x-auto'>
                                                {validationError.details}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className='flex gap-3'>
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log(
                                                        'Test Connection button clicked',
                                                        formData,
                                                    );
                                                    try {
                                                        await validateConnection();
                                                        console.log(
                                                            'Validation completed successfully',
                                                        );
                                                    } catch (error) {
                                                        console.error(
                                                            'Validation failed:',
                                                            error,
                                                        );
                                                    }
                                                }}
                                                disabled={isValidating}
                                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                                                    isValidating
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                            >
                                                {isValidating
                                                    ? 'Validating...'
                                                    : 'Test Connection'}
                                            </button>
                                            {validationError && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            setCurrentStep(3)
                                                        }
                                                        className='flex-1 py-3 px-4 rounded-lg font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-200'
                                                    >
                                                        Edit Credentials
                                                    </button>
                                                    <button className='flex-1 py-3 px-4 rounded-lg font-medium text-blue-600 hover:bg-slate-50 transition-all duration-200'>
                                                        View permissions
                                                        required
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // Form Fields
                                    <div className='space-y-6'>
                                        {(currentStepData?.getFields
                                            ? currentStepData.getFields(
                                                  formData,
                                              )
                                            : currentStepData?.fields || []
                                        ).map(
                                            (
                                                field: ConnectorField,
                                                index: number,
                                            ) => (
                                                <div key={index}>
                                                    <div className='flex items-center gap-1 mb-2'>
                                                        <label className='block text-sm font-medium text-slate-700'>
                                                            {field.label}{' '}
                                                            {field.required && (
                                                                <span className='text-red-500'>
                                                                    *
                                                                </span>
                                                            )}
                                                        </label>
                                                        {field.help && (
                                                            <div className='relative group'>
                                                                <InformationCircleIcon className='w-4 h-4 text-slate-400 cursor-help' />
                                                                <div className='absolute left-0 bottom-full mb-2 w-80 p-3 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-pre-wrap'>
                                                                    {field.help}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {field.type === 'radio' ? (
                                                        <div className='flex gap-6'>
                                                            {field.options?.map(
                                                                (option) => (
                                                                    <label
                                                                        key={
                                                                            option
                                                                        }
                                                                        className='flex items-center gap-2 cursor-pointer'
                                                                    >
                                                                        <div className='relative flex items-center justify-center w-5 h-5'>
                                                                            <input
                                                                                type='radio'
                                                                                name={
                                                                                    field.label
                                                                                }
                                                                                value={
                                                                                    option
                                                                                }
                                                                                checked={
                                                                                    formData[
                                                                                        field
                                                                                            .label
                                                                                    ] ===
                                                                                    option
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    handleInputChange(
                                                                                        field.label,
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className='w-5 h-5 border-2 border-slate-300 rounded-full appearance-none cursor-pointer checked:border-blue-500 checked:border-[6px] transition-all duration-200'
                                                                            />
                                                                        </div>
                                                                        <span className='text-slate-700'>
                                                                            {
                                                                                option
                                                                            }
                                                                        </span>
                                                                    </label>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : field.type ===
                                                      'select' ? (
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
                                        ? 'Finish'
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
