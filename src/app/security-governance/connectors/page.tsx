'use client';

import {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import ConnectorDetailsPanel from '@/components/ConnectorDetailsPanel';
import {motion, AnimatePresence} from 'framer-motion';
// @ts-ignore
import * as XLSX from 'xlsx';
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    LinkIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    Squares2X2Icon,
    BookmarkIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface ConnectorRecord {
    id: string;
    connectorName: string;
    description: string;
    type: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    lastUpdated: string;
    createdAt: string;
    createdBy: string;
}

// Reusable trash button (copied from credentials manager)
function ToolbarTrashButton({
    onClick,
    bounce = false,
}: {
    onClick?: () => void;
    bounce?: boolean;
}) {
    const [over, setOver] = useState(false);
    return (
        <motion.button
            id='connector-trash-target'
            type='button'
            onClick={onClick}
            aria-label='Trash'
            aria-dropeffect='move'
            className={`group relative ml-3 inline-flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-300 transform ${
                over
                    ? 'bg-gradient-to-br from-red-400 to-red-600 border-red-500 ring-4 ring-red-300/50 scale-110 shadow-lg'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-500 hover:to-red-600 hover:border-red-500 hover:shadow-lg hover:scale-105'
            } ${over ? 'drag-over' : ''}`}
            title='Trash'
            whileHover={{
                scale: 1.1,
                rotate: [0, -8, 8, 0],
                transition: {duration: 0.4},
            }}
            whileTap={{
                scale: 0.95,
                transition: {duration: 0.1},
            }}
        >
            <TrashIcon
                className={`w-5 h-5 transition-colors duration-300 ${
                    over ? 'text-white' : 'text-red-600 group-hover:text-white'
                }`}
            />
            <style jsx>{`
                .drag-over {
                    animation: trashBounce 0.6s ease-in-out infinite;
                }
                @keyframes trashBounce {
                    0%,
                    100% {
                        transform: scale(1.1) translateY(0);
                    }
                    50% {
                        transform: scale(1.1) translateY(-4px);
                    }
                }
            `}</style>
        </motion.button>
    );
}

// Connector Categories with proper SVG icons from public/images/logos (same as pipeline canvas)
const connectorCategories = {
    plan: {
        name: 'PLAN',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='16'
                    rx='2'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='5'
                    rx='2'
                    fill='currentColor'
                    opacity='0.2'
                />
                <path
                    d='M7 2V6M17 2V6'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
            </svg>
        ),
        connectors: [
            {
                id: 'jira',
                name: 'JIRA',
                icon: (
                    <img
                        src='/images/logos/jira.svg'
                        alt='JIRA'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'trello',
                name: 'Trello',
                icon: (
                    <img
                        src='/images/logos/trello.svg'
                        alt='Trello'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'asana',
                name: 'Asana',
                icon: (
                    <img
                        src='/images/logos/asana.svg'
                        alt='Asana'
                        className='w-8 h-8'
                    />
                ),
            },
        ],
    },
    code: {
        name: 'CODE',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <rect
                    x='2'
                    y='3'
                    width='20'
                    height='18'
                    rx='2'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <rect
                    x='2'
                    y='3'
                    width='20'
                    height='6'
                    rx='2'
                    fill='currentColor'
                    opacity='0.2'
                />
                <circle cx='6' cy='6' r='1' fill='currentColor' />
                <circle cx='9' cy='6' r='1' fill='currentColor' />
                <circle cx='12' cy='6' r='1' fill='currentColor' />
                <path
                    d='M8 14l2-2-2-2'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <path
                    d='M12 14h4'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                />
            </svg>
        ),
        connectors: [
            {
                id: 'github',
                name: 'Github',
                icon: (
                    <img
                        src='/images/logos/github.svg'
                        alt='GitHub'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'gitlab',
                name: 'GitLab',
                icon: (
                    <img
                        src='/images/logos/gitlab.svg'
                        alt='GitLab'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'azurerepo',
                name: 'AzureRepo',
                icon: (
                    <img
                        src='/images/logos/azure.svg'
                        alt='Azure Repos'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'bitbucket',
                name: 'Bitbucket',
                icon: (
                    <img
                        src='/images/logos/bitbucket.svg'
                        alt='Bitbucket'
                        className='w-8 h-8'
                    />
                ),
            },
        ],
    },
    build: {
        name: 'BUILD',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.5 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.5 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.22 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.94C7.96 18.34 8.52 18.68 9.13 18.93L9.5 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.5 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.94L19.05 18.95C19.27 19.03 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z' />
            </svg>
        ),
        connectors: [
            {
                id: 'jenkins',
                name: 'Jenkins',
                icon: (
                    <img
                        src='/images/logos/jenkins.svg'
                        alt='Jenkins'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'github-actions',
                name: 'GitHub Actions',
                icon: (
                    <img
                        src='/images/logos/github_actions.png'
                        alt='GitHub Actions'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'aws',
                name: 'AWS',
                icon: (
                    <img
                        src='/images/logos/aws.svg'
                        alt='AWS'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'circleci',
                name: 'CircleCI',
                icon: (
                    <img
                        src='/images/logos/circleci.svg'
                        alt='CircleCI'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'travis',
                name: 'Travis CI',
                icon: (
                    <img
                        src='/images/logos/travis_ci.svg'
                        alt='Travis CI'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'gitlab-ci',
                name: 'GitLab CI',
                icon: (
                    <img
                        src='/images/logos/gitlab_ci.svg'
                        alt='GitLab CI'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'teamcity',
                name: 'TeamCity',
                icon: (
                    <img
                        src='/images/logos/teamcity.svg'
                        alt='TeamCity'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'bamboo',
                name: 'Bamboo',
                icon: (
                    <img
                        src='/images/logos/bamboo.png'
                        alt='Bamboo'
                        className='w-8 h-8'
                    />
                ),
            },
        ],
    },
    test: {
        name: 'TEST',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path
                    d='M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z'
                    opacity='0.2'
                />
                <path
                    d='M7 12L10 15L17 8'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                />
            </svg>
        ),
        connectors: [
            {
                id: 'cypress',
                name: 'Cypress',
                icon: (
                    <img
                        src='/images/logos/cypress.png'
                        alt='Cypress'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'mocha',
                name: 'Mocha',
                icon: (
                    <img
                        src='/images/logos/mocha.svg'
                        alt='Mocha'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'playwright',
                name: 'Playwright',
                icon: (
                    <img
                        src='/images/logos/playwright.svg'
                        alt='Playwright'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'puppeteer',
                name: 'Puppeteer',
                icon: (
                    <img
                        src='/images/logos/puppeteer.png'
                        alt='Puppeteer'
                        className='w-8 h-8'
                    />
                ),
            },
        ],
    },
    deploy: {
        name: 'DEPLOY',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2L2 7L12 12L22 7L12 2Z' opacity='0.3' />
                <path
                    d='M2 17L12 22L22 17'
                    stroke='currentColor'
                    strokeWidth='2'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <path
                    d='M2 12L12 17L22 12'
                    stroke='currentColor'
                    strokeWidth='2'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
            </svg>
        ),
        connectors: [
            {
                id: 'kubernetes',
                name: 'Kubernetes',
                icon: (
                    <img
                        src='/images/logos/kubernetes.svg'
                        alt='Kubernetes'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'helm',
                name: 'Helm',
                icon: (
                    <img
                        src='/images/logos/helm.svg'
                        alt='Helm'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'aws-deploy',
                name: 'AWS',
                icon: (
                    <img
                        src='/images/logos/aws.svg'
                        alt='AWS'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'docker',
                name: 'Docker',
                icon: (
                    <img
                        src='/images/logos/docker.svg'
                        alt='Docker'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'terraform',
                name: 'Terraform',
                icon: (
                    <img
                        src='/images/logos/terraform.svg'
                        alt='Terraform'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'ansible',
                name: 'Ansible',
                icon: (
                    <img
                        src='/images/logos/ansible.svg'
                        alt='Ansible'
                        className='w-8 h-8'
                    />
                ),
            },
        ],
    },
    approval: {
        name: 'APPROVAL',
        icon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <path
                    d='M20 6L9 17l-5-5'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <circle cx='12' cy='12' r='9' strokeWidth='2' opacity='0.3' />
            </svg>
        ),
        connectors: [
            {
                id: 'slack',
                name: 'Slack',
                icon: (
                    <img
                        src='/images/logos/slack.svg'
                        alt='Slack'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'teams',
                name: 'Teams',
                icon: (
                    <img
                        src='/images/logos/teams.svg'
                        alt='Microsoft Teams'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'discord',
                name: 'Discord',
                icon: (
                    <img
                        src='/images/logos/discord.svg'
                        alt='Discord'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'email',
                name: 'Email',
                icon: (
                    <img
                        src='/images/logos/email.png'
                        alt='Email'
                        className='w-8 h-8'
                    />
                ),
            },
        ],
    },
    release: {
        name: 'RELEASE',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <rect
                    x='3'
                    y='6'
                    width='18'
                    height='12'
                    rx='2'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <rect
                    x='3'
                    y='6'
                    width='18'
                    height='4'
                    rx='2'
                    fill='currentColor'
                    opacity='0.2'
                />
                <path
                    d='M12 2L8 6H16L12 2Z'
                    fill='currentColor'
                    opacity='0.6'
                />
            </svg>
        ),
        connectors: [
            {
                id: 'grafana',
                name: 'Grafana',
                icon: (
                    <img
                        src='/images/logos/grafana.svg'
                        alt='Grafana'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'prometheus',
                name: 'Prometheus',
                icon: (
                    <img
                        src='/images/logos/prometheus.svg'
                        alt='Prometheus'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'datadog',
                name: 'Datadog',
                icon: (
                    <img
                        src='/images/logos/datadog.svg'
                        alt='Datadog'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'new-relic',
                name: 'New Relic',
                icon: (
                    <img
                        src='/images/logos/new_relic.svg'
                        alt='New Relic'
                        className='w-8 h-8'
                    />
                ),
            },
        ],
    },
};

// Create Connector Sidebar Component (category-wise with SVG icons)
function CreateConnectorSidebar({
    isOpen,
    onClose,
    onSave,
    onConnectorSelect,
    shouldResetSelection,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (connector: Partial<ConnectorRecord>) => void;
    onConnectorSelect: (connector: any) => void;
    shouldResetSelection?: boolean;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConnector, setSelectedConnector] = useState<any>(null);

    // Reset selection when requested (e.g., when details panel is closed)
    useEffect(() => {
        if (shouldResetSelection) {
            setSelectedConnector(null);
        }
    }, [shouldResetSelection]);

    const handleConnectorSelect = (connector: any) => {
        console.log('🔗 Connector selected:', connector.name);
        setSelectedConnector(connector);
        // Notify parent component to open the connector details panel
        onConnectorSelect(connector);
    };

    const handleConnectorSave = () => {
        if (selectedConnector) {
            onSave({
                connectorName: selectedConnector.name,
                description: `${selectedConnector.name} connector integration`,
                type: selectedConnector.id.toUpperCase(),
                status: 'ACTIVE' as const,
                id: `connector-${Date.now()}`,
                lastUpdated: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                createdBy: 'current-user',
            });
            setSelectedConnector(null);
            onClose();
        }
    };

    // Filter categories based on search
    const filteredCategories = Object.entries(connectorCategories)
        .map(([key, category]) => ({
            key,
            ...category,
            connectors: category.connectors.filter((connector) =>
                connector.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
            ),
        }))
        .filter((category) => category.connectors.length > 0 || !searchQuery);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className='fixed inset-0 bg-black bg-opacity-50 z-40'
                        onClick={onClose}
                    />

                    {/* Main Sidebar - Collapsed when connector selected */}
                    <motion.div
                        initial={{x: '100%'}}
                        animate={{
                            x: selectedConnector ? '-500px' : 0,
                            width: selectedConnector ? '80px' : '500px',
                        }}
                        exit={{x: '100%'}}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 200,
                        }}
                        className='fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col'
                        style={{
                            width: selectedConnector ? '80px' : '500px',
                        }}
                    >
                        {/* Header with frame.svg background */}
                        <div
                            className='relative border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100'
                            style={{
                                padding: selectedConnector
                                    ? '12px 8px'
                                    : '24px',
                            }}
                        >
                            <div className='absolute inset-0 opacity-10'>
                                <img
                                    src='/images/logos/frame.svg'
                                    alt='Frame'
                                    className='w-full h-full object-cover'
                                />
                            </div>
                            <div className='relative flex items-center justify-between'>
                                {selectedConnector ? (
                                    // Collapsed header - minimal layout
                                    <div className='flex flex-col items-center w-full space-y-2'>
                                        <button
                                            onClick={onClose}
                                            className='p-1 hover:bg-white/20 rounded-full transition-colors'
                                        >
                                            <XMarkIcon className='w-4 h-4 text-gray-700' />
                                        </button>
                                    </div>
                                ) : (
                                    // Expanded header - horizontal layout
                                    <>
                                        <div className='flex items-center space-x-3'>
                                            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                                                <svg
                                                    className='w-5 h-5 text-white'
                                                    fill='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path d='M12 2L2 7L12 12L22 7L12 2Z' />
                                                </svg>
                                            </div>
                                            <h2 className='text-xl font-bold text-gray-900'>
                                                Connectors
                                            </h2>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className='p-2 hover:bg-white/20 rounded-full transition-colors'
                                        >
                                            <XMarkIcon className='w-5 h-5 text-gray-700' />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {selectedConnector ? (
                            // Collapsed view - show all categories vertically
                            <div className='flex-1 flex flex-col relative'>
                                {/* Vertical category list */}
                                <div className='relative flex-1 overflow-y-auto py-4 space-y-4'>
                                    {Object.entries(connectorCategories).map(
                                        ([key, category]) => (
                                            <div
                                                key={key}
                                                className='flex justify-center cursor-pointer group'
                                                onClick={() =>
                                                    setSelectedConnector(null)
                                                }
                                                title={`Open ${category.name} connectors`}
                                            >
                                                {/* Category Icon - Animated, Icons Only */}
                                                <div className='w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center hover:bg-blue-100 group-hover:scale-110 transition-all shadow-sm'>
                                                    <div className='w-6 h-6 text-blue-600'>
                                                        {key === 'plan' ? (
                                                            <svg
                                                                className='w-6 h-6'
                                                                fill='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <rect
                                                                    x='3'
                                                                    y='4'
                                                                    width='18'
                                                                    height='16'
                                                                    rx='2'
                                                                    fill='none'
                                                                    stroke='currentColor'
                                                                    strokeWidth='1.5'
                                                                />
                                                                <rect
                                                                    x='3'
                                                                    y='4'
                                                                    width='18'
                                                                    height='5'
                                                                    rx='2'
                                                                    fill='currentColor'
                                                                    opacity='0.2'
                                                                >
                                                                    <animate
                                                                        attributeName='opacity'
                                                                        values='0.2;0.6;0.2'
                                                                        dur='2s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </rect>
                                                                <path
                                                                    d='M7 2V6M17 2V6'
                                                                    stroke='currentColor'
                                                                    strokeWidth='2'
                                                                    strokeLinecap='round'
                                                                />
                                                                <rect
                                                                    x='6'
                                                                    y='11'
                                                                    width='3'
                                                                    height='2'
                                                                    rx='0.5'
                                                                    fill='currentColor'
                                                                    opacity='0.6'
                                                                >
                                                                    <animate
                                                                        attributeName='opacity'
                                                                        values='0.6;1;0.6'
                                                                        dur='1.5s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </rect>
                                                            </svg>
                                                        ) : key === 'build' ? (
                                                            <svg
                                                                className='w-6 h-6'
                                                                fill='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <path d='M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.5 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.5 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.22 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.94C7.96 18.34 8.52 18.68 9.13 18.93L9.5 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.5 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.94L19.05 18.95C19.27 19.03 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z'>
                                                                    <animateTransform
                                                                        attributeName='transform'
                                                                        attributeType='XML'
                                                                        type='rotate'
                                                                        from='0 12 12'
                                                                        to='360 12 12'
                                                                        dur='4s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </path>
                                                            </svg>
                                                        ) : key === 'deploy' ? (
                                                            <svg
                                                                className='w-6 h-6'
                                                                fill='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <path
                                                                    d='M12 2L2 7L12 12L22 7L12 2Z'
                                                                    opacity='0.3'
                                                                >
                                                                    <animate
                                                                        attributeName='opacity'
                                                                        values='0.3;0.6;0.3'
                                                                        dur='2s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </path>
                                                                <path
                                                                    d='M2 17L12 22L22 17'
                                                                    stroke='currentColor'
                                                                    strokeWidth='2'
                                                                    fill='none'
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                >
                                                                    <animate
                                                                        attributeName='stroke-dasharray'
                                                                        values='0 40;20 20;40 0;20 20;0 40'
                                                                        dur='3s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </path>
                                                                <circle
                                                                    cx='12'
                                                                    cy='17'
                                                                    r='1'
                                                                    fill='currentColor'
                                                                    opacity='0.6'
                                                                >
                                                                    <animate
                                                                        attributeName='r'
                                                                        values='1;2;1'
                                                                        dur='2s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </circle>
                                                            </svg>
                                                        ) : key === 'code' ? (
                                                            <svg
                                                                className='w-6 h-6'
                                                                fill='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <rect
                                                                    x='2'
                                                                    y='3'
                                                                    width='20'
                                                                    height='18'
                                                                    rx='2'
                                                                    fill='none'
                                                                    stroke='currentColor'
                                                                    strokeWidth='1.5'
                                                                />
                                                                <rect
                                                                    x='2'
                                                                    y='3'
                                                                    width='20'
                                                                    height='6'
                                                                    rx='2'
                                                                    fill='currentColor'
                                                                    opacity='0.2'
                                                                />
                                                                <path
                                                                    d='M8 14l2-2-2-2'
                                                                    stroke='currentColor'
                                                                    strokeWidth='1.5'
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                >
                                                                    <animate
                                                                        attributeName='opacity'
                                                                        values='0.7;1;0.7'
                                                                        dur='2s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </path>
                                                                <path
                                                                    d='M12 14h4'
                                                                    stroke='currentColor'
                                                                    strokeWidth='1.5'
                                                                    strokeLinecap='round'
                                                                >
                                                                    <animate
                                                                        attributeName='stroke-dasharray'
                                                                        values='0 6;3 3;6 0;3 3;0 6'
                                                                        dur='3s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </path>
                                                            </svg>
                                                        ) : key === 'test' ? (
                                                            <svg
                                                                className='w-6 h-6'
                                                                fill='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <path
                                                                    d='M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z'
                                                                    opacity='0.2'
                                                                />
                                                                <path
                                                                    d='M7 12L10 15L17 8'
                                                                    stroke='currentColor'
                                                                    strokeWidth='2'
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                    fill='none'
                                                                >
                                                                    <animate
                                                                        attributeName='stroke-dasharray'
                                                                        values='0 24;12 12;24 0;12 12;0 24'
                                                                        dur='3s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </path>
                                                                <circle
                                                                    cx='7'
                                                                    cy='8'
                                                                    r='1'
                                                                    fill='currentColor'
                                                                    opacity='0.6'
                                                                >
                                                                    <animate
                                                                        attributeName='opacity'
                                                                        values='0.6;1;0.6'
                                                                        dur='1s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </circle>
                                                            </svg>
                                                        ) : key ===
                                                          'approval' ? (
                                                            <svg
                                                                className='w-5 h-5'
                                                                fill='none'
                                                                stroke='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <path
                                                                    d='M20 6L9 17l-5-5'
                                                                    strokeWidth='2'
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                >
                                                                    <animate
                                                                        attributeName='stroke-dasharray'
                                                                        values='0 30;15 15;30 0;15 15;0 30'
                                                                        dur='3s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </path>
                                                                <circle
                                                                    cx='12'
                                                                    cy='12'
                                                                    r='9'
                                                                    strokeWidth='2'
                                                                    opacity='0.3'
                                                                >
                                                                    <animate
                                                                        attributeName='r'
                                                                        values='9;11;9'
                                                                        dur='2s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                    <animate
                                                                        attributeName='opacity'
                                                                        values='0.3;0.6;0.3'
                                                                        dur='2s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </circle>
                                                            </svg>
                                                        ) : key ===
                                                          'release' ? (
                                                            <svg
                                                                className='w-6 h-6'
                                                                fill='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <rect
                                                                    x='3'
                                                                    y='6'
                                                                    width='18'
                                                                    height='12'
                                                                    rx='2'
                                                                    fill='none'
                                                                    stroke='currentColor'
                                                                    strokeWidth='1.5'
                                                                />
                                                                <rect
                                                                    x='3'
                                                                    y='6'
                                                                    width='18'
                                                                    height='4'
                                                                    rx='2'
                                                                    fill='currentColor'
                                                                    opacity='0.2'
                                                                />
                                                                <path
                                                                    d='M12 2L8 6H16L12 2Z'
                                                                    fill='currentColor'
                                                                    opacity='0.6'
                                                                >
                                                                    <animate
                                                                        attributeName='opacity'
                                                                        values='0.6;1;0.6'
                                                                        dur='2s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </path>
                                                                <rect
                                                                    x='6'
                                                                    y='12'
                                                                    width='4'
                                                                    height='2'
                                                                    rx='0.5'
                                                                    fill='currentColor'
                                                                    opacity='0.7'
                                                                >
                                                                    <animate
                                                                        attributeName='opacity'
                                                                        values='0.7;1;0.7'
                                                                        dur='1.5s'
                                                                        repeatCount='indefinite'
                                                                    />
                                                                </rect>
                                                            </svg>
                                                        ) : (
                                                            category.icon
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Search */}
                                <div className='p-4 border-b border-gray-200'>
                                    <div className='relative'>
                                        <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                                        <input
                                            type='text'
                                            placeholder='Search'
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>
                                </div>

                                {/* Categories and Connectors */}
                                <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-white/80'>
                                    {filteredCategories.map((category) => (
                                        <div key={category.key}>
                                            {/* Category Header */}
                                            <div className='flex items-center space-x-2 mb-3'>
                                                <div className='w-5 h-5 text-blue-600'>
                                                    {category.icon}
                                                </div>
                                                <h3 className='text-sm font-bold text-gray-900 uppercase tracking-wider'>
                                                    {category.name}
                                                </h3>
                                                <div className='flex-1 h-px bg-gray-200'></div>
                                            </div>

                                            {/* Connectors List - Compact */}
                                            <div className='grid grid-cols-4 gap-2'>
                                                {category.connectors.map(
                                                    (connector) => (
                                                        <div
                                                            key={connector.id}
                                                            onClick={() =>
                                                                handleConnectorSelect(
                                                                    connector,
                                                                )
                                                            }
                                                            className={`flex flex-col items-center p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 cursor-pointer transition-all duration-200 group border ${
                                                                selectedConnector?.id ===
                                                                connector.id
                                                                    ? 'border-blue-500 bg-blue-100'
                                                                    : 'border-transparent hover:border-blue-200'
                                                            }`}
                                                        >
                                                            {/* Icon */}
                                                            <div className='w-8 h-8 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform'>
                                                                {connector.icon}
                                                            </div>

                                                            {/* Connector Name */}
                                                            <span className='text-xs font-medium text-gray-700 text-center leading-tight'>
                                                                {connector.name}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Progressive Sidebar for Connector Configuration - Using ConnectorDetailsPanel */}
                    <ConnectorDetailsPanel
                        isOpen={!!selectedConnector}
                        onClose={() => setSelectedConnector(null)}
                        connector={selectedConnector}
                        sidebarWidth={0} // No main sidebar on this page
                    />
                </>
            )}
        </AnimatePresence>
    );
}

export default function Connectors() {
    const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showCreateSidebar, setShowCreateSidebar] = useState(false);
    const [showConnectorDetails, setShowConnectorDetails] = useState(false);
    const [selectedConnectorForDetails, setSelectedConnectorForDetails] =
        useState<any>(null);
    const [shouldResetSelection, setShouldResetSelection] = useState(false);
    const [saveNotifications, setSaveNotifications] = useState<
        Array<{id: string; message: string; timestamp: number}>
    >([]);

    // Function to show save notification
    const showSaveNotification = useCallback((message: string) => {
        const id = Date.now().toString();
        const notification = {
            id,
            message,
            timestamp: Date.now(),
        };

        setSaveNotifications((prev) => [...prev, notification]);

        // Auto-remove notification after 3 seconds
        setTimeout(() => {
            setSaveNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3000);
    }, []);

    // Load connectors from API
    const loadConnectors = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading connectors from API...');

            // Mock API call - replace with actual API
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Initially no connectors - empty state
            setConnectors([]);

            console.log('✅ Connectors loaded successfully');
        } catch (error) {
            console.error('❌ Error loading connectors:', error);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array to prevent repeated calls

    useEffect(() => {
        loadConnectors();
    }, []); // Empty dependency array to load only once

    // Handle create connector
    const handleCreateConnector = useCallback(() => {
        console.log('➕ Opening create connector sidebar...');
        setShowCreateSidebar(true);
    }, []);

    // Handle connector selection from create sidebar
    const handleConnectorSelect = useCallback((connector: any) => {
        console.log('🔗 Connector selected for configuration:', connector.name);
        setSelectedConnectorForDetails(connector);
        setShowConnectorDetails(true);
        // Keep the create sidebar open but collapsed (showing only icons)
        // setShowCreateSidebar(false); // Remove this to keep sidebar visible in collapsed state
    }, []);

    // Handle save connector
    const handleSaveConnector = useCallback(
        (connectorData: Partial<ConnectorRecord>) => {
            console.log('💾 Saving new connector:', connectorData);
            const newConnector = connectorData as ConnectorRecord;
            setConnectors((prev) => [...prev, newConnector]);
            showSaveNotification('Connector created successfully');
        },
        [showSaveNotification],
    );

    // Confirm delete
    const confirmDelete = useCallback(() => {
        if (pendingDeleteId) {
            console.log('✅ Confirmed delete for connector:', pendingDeleteId);
            setConnectors((prev) =>
                prev.filter((c) => c.id !== pendingDeleteId),
            );
            setPendingDeleteId(null);
            showSaveNotification('Connector deleted successfully');
        }
    }, [pendingDeleteId, showSaveNotification]);

    return (
        <div className='h-full bg-white flex flex-col relative -mx-4 -my-3'>
            {/* Save Notifications */}
            <div
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}
            >
                {saveNotifications.map((notification, index) => (
                    <div
                        key={notification.id}
                        className='save-notification-toast'
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}
                    >
                        {notification.message}
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className='bg-white border-b border-gray-200 px-8 py-3'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900'>
                        Connectors: Account Name
                    </h1>
                    <p className='text-sm text-gray-600 mt-0.5'>
                        Manage system integrations and data connectors
                    </p>
                </div>
            </div>

            {/* Action Bar */}
            <div className='bg-white border-b border-gray-200 px-8 py-3'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                        {/* Create Connector Button */}
                        <motion.button
                            onClick={handleCreateConnector}
                            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <PlusIcon className='w-4 h-4 mr-2' />
                            Create Connector
                        </motion.button>

                        {/* Search Button */}
                        <motion.button
                            onClick={() => setShowSearchBar(!showSearchBar)}
                            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors duration-200 ${
                                showSearchBar
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <MagnifyingGlassIcon className='w-4 h-4 mr-1' />
                            Search
                        </motion.button>

                        {/* Filter Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <FunnelIcon className='w-4 h-4 mr-1' />
                            Filter
                        </motion.button>

                        {/* Sort Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <ArrowsUpDownIcon className='w-4 h-4 mr-1' />
                            Sort
                        </motion.button>

                        {/* Hide Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <Squares2X2Icon className='w-4 h-4 mr-1' />
                            Hide
                        </motion.button>

                        {/* Group By Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <Squares2X2Icon className='w-4 h-4 mr-1' />
                            Group by
                        </motion.button>

                        {/* Views Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            Views
                        </motion.button>

                        {/* More Options */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <EllipsisVerticalIcon className='w-4 h-4' />
                        </motion.button>

                        {/* Trash Button */}
                        <ToolbarTrashButton
                            onClick={() => console.log('Trash clicked')}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 overflow-hidden bg-white'>
                {loading ? (
                    // Loading State - Same as Enterprise Configuration
                    <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                        <div className='mx-auto max-w-md'>
                            <div className='mx-auto h-12 w-12 text-blue-600 animate-spin'>
                                <svg
                                    className='h-full w-full'
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
                                    />
                                    <path
                                        className='opacity-75'
                                        fill='currentColor'
                                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                    />
                                </svg>
                            </div>
                            <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                Loading Connectors
                            </h3>
                            <p className='mt-2 text-sm text-slate-500'>
                                Please wait while we fetch your connectors...
                            </p>
                        </div>
                    </div>
                ) : connectors.length === 0 ? (
                    /* Empty State */
                    <div className='flex items-center justify-center h-64'>
                        <div className='text-center'>
                            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <LinkIcon className='w-8 h-8 text-gray-400' />
                            </div>
                            <h3 className='text-lg font-medium text-gray-900 mb-2'>
                                No connectors
                            </h3>
                            <p className='text-gray-500 mb-4'>
                                Get started by creating your first connector
                            </p>
                            <motion.button
                                onClick={handleCreateConnector}
                                className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                            >
                                <PlusIcon className='w-4 h-4 mr-2' />
                                Create Connector
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    /* Connectors Table - TODO: Implement table component */
                    <div className='h-full w-full overflow-hidden px-4'>
                        <div className='p-8 text-center text-gray-500'>
                            Connectors table will be implemented here
                        </div>
                    </div>
                )}
            </div>

            {/* Create Connector Sidebar */}
            <CreateConnectorSidebar
                isOpen={showCreateSidebar}
                onClose={() => setShowCreateSidebar(false)}
                onSave={handleSaveConnector}
                onConnectorSelect={handleConnectorSelect}
                shouldResetSelection={shouldResetSelection}
            />

            {/* Connector Details Panel */}
            <ConnectorDetailsPanel
                isOpen={showConnectorDetails}
                onClose={() => {
                    setShowConnectorDetails(false);
                    setSelectedConnectorForDetails(null);
                    // Reset the selection in the create sidebar to expand it back
                    setShouldResetSelection(true);
                    setTimeout(() => setShouldResetSelection(false), 100); // Reset the flag
                }}
                connector={selectedConnectorForDetails}
                sidebarWidth={0} // No main sidebar on this page
            />

            {/* Delete Confirmation Modal */}
            {pendingDeleteId && (
                <ConfirmModal
                    open={!!pendingDeleteId}
                    onCancel={() => setPendingDeleteId(null)}
                    onConfirm={confirmDelete}
                    title='Delete Connector'
                    message='Are you sure you want to delete this connector? This action cannot be undone.'
                    confirmText='Delete'
                    cancelText='Cancel'
                />
            )}

            {/* CSS for save notifications */}
            <style jsx>{`
                .save-notification-toast {
                    background: linear-gradient(
                        135deg,
                        #10b981 0%,
                        #059669 100%
                    );
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    font-size: 14px;
                    font-weight: 500;
                    animation: slideInFromRight 0.3s ease-out forwards;
                    max-width: 300px;
                    word-wrap: break-word;
                }

                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
