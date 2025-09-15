'use client';

import {useState} from 'react';
import {WorkflowNodeType} from '@/types/workflow';

// SVG Icon Components
const ServerIcon = () => (
    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
            fillRule='evenodd'
            d='M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z'
            clipRule='evenodd'
        />
    </svg>
);

const ClipboardIcon = () => (
    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
        <path d='M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' />
        <path d='M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z' />
    </svg>
);

const CodeIcon = () => (
    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
            fillRule='evenodd'
            d='M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z'
            clipRule='evenodd'
        />
    </svg>
);

const CogIcon = () => (
    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
            fillRule='evenodd'
            d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
            clipRule='evenodd'
        />
    </svg>
);

const BeakerIcon = () => (
    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
            fillRule='evenodd'
            d='M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z'
            clipRule='evenodd'
        />
    </svg>
);

const RocketIcon = () => (
    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
            fillRule='evenodd'
            d='M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011-11 6.98 6.98 0 01-1.605 1.553zM13.196 8.084c.184-.587.332-1.16.446-1.71.228-1.09.348-2.07.428-2.73.019-.158.03-.292.037-.403.007-.11.007-.199 0-.282.223.47.404.904.534 1.295.252.754.356 1.48.356 2.205v.015a23.086 23.086 0 01-.801 1.81zm-4.193-1.13a7.13 7.13 0 01-.398-2.654A1 1 0 007.05 6.05 6.981 6.981 0 005 11a7 7 0 1011-11c.64 0 1.248.1 1.826.284zM13 7.28a20.93 20.93 0 00-.198-.68A20.93 20.93 0 0012.123 5a20.93 20.93 0 00-.68-.198A20.93 20.93 0 0010 4.6zM7 16a7 7 0 1011-11c.64 0 1.248.1 1.826.284z'
            clipRule='evenodd'
        />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
            clipRule='evenodd'
        />
    </svg>
);

const CubeIcon = () => (
    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
        <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
    </svg>
);

// Workflow Categories for the first panel
const workflowCategories = [
    {
        id: 'nodes',
        label: 'Nodes',
        icon: <ServerIcon />,
        description: 'Environment nodes',
        count: 3,
        color: 'bg-blue-500',
    },
    {
        id: 'plan',
        label: 'Plan',
        icon: <ClipboardIcon />,
        description: 'Planning tools',
        count: 3,
        color: 'bg-purple-500',
    },
    {
        id: 'code',
        label: 'Code',
        icon: <CodeIcon />,
        description: 'Source management',
        count: 3,
        color: 'bg-green-500',
    },
    {
        id: 'build',
        label: 'Build',
        icon: <CogIcon />,
        description: 'Build systems',
        count: 3,
        color: 'bg-orange-500',
    },
    {
        id: 'test',
        label: 'Test',
        icon: <BeakerIcon />,
        description: 'Testing tools',
        count: 3,
        color: 'bg-red-500',
    },
    {
        id: 'deploy',
        label: 'Deploy',
        icon: <RocketIcon />,
        description: 'Deployment',
        count: 5,
        color: 'bg-indigo-500',
    },
    {
        id: 'approval',
        label: 'Approval',
        icon: <CheckCircleIcon />,
        description: 'Approval gates',
        count: 3,
        color: 'bg-yellow-500',
    },
    {
        id: 'release',
        label: 'Release',
        icon: <CubeIcon />,
        description: 'Release management',
        count: 3,
        color: 'bg-pink-500',
    },
];

// Brand Logo Components
const GitHubLogo = () => (
    <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
        <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
    </svg>
);

const JiraLogo = () => (
    <svg className='w-6 h-6' fill='#0052CC' viewBox='0 0 24 24'>
        <path d='M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78c.28 0 .53.22.53.53v1.78c0 2.4 1.97 4.35 4.35 4.35.28 0 .53.22.53.53v8.93c0 .28-.22.53-.53.53H2.53c-.28 0-.53-.22-.53-.53V2.53c0-.28.22-.53.53-.53h8.47c.28 0 .53.22.53.53z' />
    </svg>
);

const DockerLogo = () => (
    <svg className='w-6 h-6' fill='#2496ED' viewBox='0 0 24 24'>
        <path d='M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186H8.1a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H5.136a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338 0-.676.03-1.01.09-.248-1.827-1.66-2.782-1.759-2.782l-.155-.212-.212.155a3.76 3.76 0 00-.537 2.07c.006.362.093.714.259 1.025-.384.217-.896.348-1.433.348H.301l-.155.646a11.7 11.7 0 00-.124 1.525c0 5.369 2.708 9.015 8.063 9.015 7.705 0 13.484-3.548 15.404-11.176 1.018.043 1.833-.24 2.42-.72.328-.267.573-.604.707-.99l.155-.424z' />
    </svg>
);

const KubernetesLogo = () => (
    <svg className='w-6 h-6' fill='#326CE5' viewBox='0 0 24 24'>
        <path d='M10.204 14.35l.007.01-.999 2.413a5.171 5.171 0 002.075-2.597l-1.082.174h-.001zm.045-1.75l.943.095-.943-.095zm.936.094l1.032-.174a5.171 5.171 0 00-2.075 2.597l.999-2.413.044-.01zm-.198.095l.012-.002-.012.002zm.978-6.08a5.171 5.171 0 00-2.904 0l1.452 3.365 1.452-3.365zm2.5 2.068a5.17 5.17 0 00-1.816-1.962l-.28 3.486 2.096-1.524zm-5.906-1.962a5.17 5.17 0 00-1.816 1.962l2.096 1.524-.28-3.486zm-1.98 6.179l.734-2.413-2.075 2.597c.457.347.94.654 1.341.816zm8.858-3.051a5.954 5.954 0 00-3.51-5.864l-.001-.003-3.51 5.864a5.954 5.954 0 007.021.003zm-9.827-.003l3.51-5.864-.001.003a5.954 5.954 0 00-3.51 5.864zm11.548 1.13l-.734-2.413c-.401-.162-.884-.469-1.341-.816l2.075 2.597v.632zm1.667-.632l-2.075-2.597a5.171 5.171 0 001.341.816l.734 2.413v-.632zm-12.324-.632l-2.075 2.597v.632l.734-2.413c.457-.347.94-.654 1.341-.816zm.999 6.632l-.999-2.413-.044-.01a5.171 5.171 0 002.075 2.597zm8.858.003l-1.032-.174-.044.01-.999 2.413a5.171 5.171 0 002.075-2.597.632.632 0 000 .348zm1.667.348a5.171 5.171 0 00-2.075-2.597l.999 2.413.044.01 1.032.174zm-11.548-.348l1.032.174.044-.01.999-2.413a5.171 5.171 0 00-2.075 2.597zm5.774.008l-1.452-3.365-1.452 3.365a5.171 5.171 0 002.904 0z' />
    </svg>
);

const AWSLogo = () => (
    <svg className='w-6 h-6' fill='#FF9900' viewBox='0 0 24 24'>
        <path d='M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576a.518.518 0 01.08.288c0 .128-.08.256-.24.384l-.792.528a.597.597 0 01-.32.112c-.128 0-.256-.064-.384-.176a3.924 3.924 0 01-.448-.576 9.71 9.71 0 01-.384-.688c-.96 1.136-2.176 1.696-3.648 1.696-1.040 0-1.872-.304-2.48-.896-.608-.608-.912-1.408-.912-2.4 0-1.056.368-1.92 1.12-2.592.752-.672 1.744-.992 2.992-.992.416 0 .848.032 1.296.096.448.064.912.144 1.392.256v-.832c0-.864-.176-1.472-.544-1.824-.352-.352-.96-.528-1.808-.528-.384 0-.784.048-1.184.128a8.564 8.564 0 00-1.088.32.896.896 0 01-.32.064c-.176 0-.272-.128-.272-.384v-.608c0-.192.032-.336.112-.432.08-.096.224-.192.432-.288A9.827 9.827 0 013.232.112C4.144.048 5.008.016 5.824.016c1.696 0 2.944.384 3.728 1.168.784.784 1.184 1.984 1.184 3.616v4.736h.027zm-5.024 1.888c.4 0 .816-.08 1.264-.224.448-.144.832-.4 1.136-.784.192-.24.336-.512.416-.832.08-.32.128-.704.128-1.12v-.544a11.04 11.04 0 00-1.12-.208 9.728 9.728 0 00-1.168-.064c-.832 0-1.44.16-1.856.496-.416.32-.624.8-.624 1.424 0 .592.144 1.024.448 1.312.288.288.704.432 1.216.432l.16.144zm9.728 1.344c-.224 0-.384-.048-.464-.128-.08-.096-.16-.256-.224-.48L7.554 2.4c-.064-.224-.096-.368-.096-.448 0-.176.08-.272.256-.272h1.056c.24 0 .4.048.48.128.096.096.16.256.224.48l2.864 11.28 2.624-11.28c.048-.224.112-.384.208-.48.096-.08.272-.128.496-.128h.864c.24 0 .4.048.496.128.096.096.176.256.208.48l2.624 11.36L22.4 2.128c.064-.224.144-.384.224-.48.096-.08.256-.128.48-.128h1.008c.176 0 .272.096.272.272 0 .064-.016.128-.032.208-.016.08-.048.192-.096.336l-3.136 10.24c-.064.224-.144.384-.224.48-.08.08-.24.128-.464.128h-.928c-.24 0-.4-.048-.496-.128-.096-.096-.176-.256-.208-.496L15.936 5.92 13.12 12.064c-.048.224-.112.384-.208.496-.096.08-.272.128-.496.128h-.928v-.016z' />
    </svg>
);

const JenkinsLogo = () => (
    <svg className='w-6 h-6' fill='#D33833' viewBox='0 0 24 24'>
        <path d='M11.543 0c.016 0 .032 0 .048.002 2.83.126 5.425 1.371 7.325 3.511 1.9 2.14 2.89 4.895 2.794 7.77-.095 2.875-1.31 5.552-3.426 7.555C16.168 20.84 13.43 22 10.555 22c-2.875 0-5.613-1.16-7.729-3.162C.71 16.835-.505 14.158-.6 11.283c-.096-2.875.894-5.63 2.794-7.77C4.094 1.373 6.689.128 9.519.002c.678-.056 1.362-.02 2.024.002z' />
    </svg>
);

// Connectors data with real brand logos
const connectorsByCategory = {
    nodes: [
        {
            type: 'node_dev',
            label: 'Development',
            logo: (
                <svg className='w-6 h-6' fill='#10B981' viewBox='0 0 24 24'>
                    <path d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
                </svg>
            ),
            description: 'Dev environment',
        },
        {
            type: 'node_qa',
            label: 'QA/Staging',
            logo: (
                <svg className='w-6 h-6' fill='#F59E0B' viewBox='0 0 24 24'>
                    <path d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                </svg>
            ),
            description: 'QA environment',
        },
        {
            type: 'node_prod',
            label: 'Production',
            logo: (
                <svg className='w-6 h-6' fill='#EF4444' viewBox='0 0 24 24'>
                    <path d='M5 3a2 2 0 00-2 2v10a2 2 0 002 2h11l3-3V5a2 2 0 00-2-2H5z' />
                    <path d='M7 8h8m-8 4h6' />
                </svg>
            ),
            description: 'Prod environment',
        },
    ],
    plan: [
        {
            type: 'plan_jira',
            label: 'Jira',
            logo: <JiraLogo />,
            description: 'Atlassian Jira',
        },
        {
            type: 'plan_trello',
            label: 'Trello',
            logo: (
                <svg className='w-6 h-6' fill='#0079BF' viewBox='0 0 24 24'>
                    <path d='M21 0H3C1.343 0 0 1.343 0 3v18c0 1.657 1.343 3 3 3h18c1.657 0 3-1.343 3-3V3c0-1.657-1.343-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H5.76c-.795 0-1.44-.645-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v12.36zm9.6-6.84c0 .795-.645 1.44-1.44 1.44h-3.24c-.795 0-1.44-.645-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44h3.24c.795 0 1.44.645 1.44 1.44v5.52z' />
                </svg>
            ),
            description: 'Trello boards',
        },
        {
            type: 'plan_asana',
            label: 'Asana',
            logo: (
                <svg className='w-6 h-6' fill='#F06A6A' viewBox='0 0 24 24'>
                    <path d='M18.78 12c1.39 0 2.52 1.13 2.52 2.52s-1.13 2.52-2.52 2.52-2.52-1.13-2.52-2.52S17.39 12 18.78 12zM5.22 12c1.39 0 2.52 1.13 2.52 2.52S6.61 17.04 5.22 17.04s-2.52-1.13-2.52-2.52S3.83 12 5.22 12zM12 6.78c1.39 0 2.52 1.13 2.52 2.52S13.39 11.82 12 11.82s-2.52-1.13-2.52-2.52S10.61 6.78 12 6.78z' />
                </svg>
            ),
            description: 'Asana projects',
        },
    ],
    code: [
        {
            type: 'code_github',
            label: 'GitHub',
            logo: <GitHubLogo />,
            description: 'GitHub repository',
        },
        {
            type: 'code_gitlab',
            label: 'GitLab',
            logo: (
                <svg className='w-6 h-6' fill='#FC6D26' viewBox='0 0 24 24'>
                    <path d='M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.423-.73-.423-.867 0L16.418 9.45H7.582L4.918 1.263c-.135-.423-.73-.423-.867 0L1.387 9.452.045 13.587c-.121.375.014.789.331 1.023L12 23.054l11.624-8.443c.318-.235.453-.648.331-1.024' />
                </svg>
            ),
            description: 'GitLab repository',
        },
        {
            type: 'code_bitbucket',
            label: 'Bitbucket',
            logo: (
                <svg className='w-6 h-6' fill='#0052CC' viewBox='0 0 24 24'>
                    <path d='M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.499.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891L.778 1.213zM14.52 15.53H9.522L8.17 8.466h7.561l-1.211 7.064z' />
                </svg>
            ),
            description: 'Bitbucket repository',
        },
    ],
    build: [
        {
            type: 'build_jenkins',
            label: 'Jenkins',
            logo: <JenkinsLogo />,
            description: 'Jenkins CI/CD',
        },
        {
            type: 'build_github_actions',
            label: 'GitHub Actions',
            logo: (
                <svg className='w-6 h-6' fill='#2088FF' viewBox='0 0 24 24'>
                    <path d='M10.984 13.836a.5.5 0 01-.353-.146L8.146 11.205a.5.5 0 010-.707l2.485-2.485a.5.5 0 01.707.707L9.207 10.852l2.131 2.131a.5.5 0 01-.354.853zm2.171-.707a.5.5 0 01-.707-.707l2.131-2.131-2.131-2.131a.5.5 0 11.707-.707l2.485 2.485a.5.5 0 010 .707l-2.485 2.484z' />
                </svg>
            ),
            description: 'GitHub Actions',
        },
        {
            type: 'build_azure_pipelines',
            label: 'Azure Pipelines',
            logo: (
                <svg className='w-6 h-6' fill='#0078D4' viewBox='0 0 24 24'>
                    <path d='M0 10.427L6.333 4v6.427H0zm17.667 3.146L24 7.148v9.425l-6.333 6.427V13.573z' />
                </svg>
            ),
            description: 'Azure DevOps',
        },
    ],
    test: [
        {
            type: 'test_jest',
            label: 'Jest',
            logo: (
                <svg className='w-6 h-6' fill='#C21325' viewBox='0 0 24 24'>
                    <path d='M22.251 11.82a3.117 3.117 0 0 0-2.328-3.01L22.911 0H8.104L11.092 8.81a3.116 3.116 0 0 0-2.244 2.988c0 1.726 1.407 3.132 3.132 3.132.945 0 1.802-.509 2.244-1.31.442.801 1.299 1.31 2.244 1.31.946 0 1.802-.509 2.244-1.31.442.801 1.299 1.31 2.244 1.31a3.117 3.117 0 0 0 3.132-3.132c0-.711-.244-1.365-.637-1.898z' />
                </svg>
            ),
            description: 'Jest testing',
        },
        {
            type: 'test_selenium',
            label: 'Selenium',
            logo: (
                <svg className='w-6 h-6' fill='#43B02A' viewBox='0 0 24 24'>
                    <path d='M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm6.343 18.343c-1.171 1.171-2.707 1.757-4.243 1.757s-3.072-.586-4.243-1.757c-1.171-1.171-1.757-2.707-1.757-4.243s.586-3.072 1.757-4.243c1.171-1.171 2.707-1.757 4.243-1.757s3.072.586 4.243 1.757c1.171 1.171 1.757 2.707 1.757 4.243s-.586 3.072-1.757 4.243z' />
                </svg>
            ),
            description: 'Selenium testing',
        },
        {
            type: 'test_cypress',
            label: 'Cypress',
            logo: (
                <svg className='w-6 h-6' fill='#17202C' viewBox='0 0 24 24'>
                    <path d='M11.998 0C5.366 0 0 5.367 0 12c0 6.633 5.366 12 11.998 12C18.632 24 24 18.633 24 12c0-6.633-5.368-12-12.002-12zM6.37 14.575c.392.523.916.742 1.657.742.35 0 .699-.044 1.004-.175.306-.13.612-.306.83-.567l1.657 1.003c-.524.785-1.224 1.35-2.009 1.653-.785.306-1.614.392-2.443.392-1.135 0-2.139-.35-3.056-1.003-.916-.698-1.397-1.645-1.397-2.855 0-.567.087-1.091.306-1.571.218-.48.523-.872.916-1.178.392-.35.872-.611 1.396-.785.523-.175 1.091-.262 1.701-.262.61 0 1.178.087 1.745.306.567.218 1.047.523 1.483.916l-1.178 1.483c-.218-.218-.48-.392-.785-.523-.306-.13-.654-.175-1.047-.175-.698 0-1.309.218-1.745.698-.48.48-.742 1.135-.742 1.963 0 .829.262 1.484.742 1.964z' />
                </svg>
            ),
            description: 'Cypress testing',
        },
    ],
    deploy: [
        {
            type: 'deploy_kubernetes',
            label: 'Kubernetes',
            logo: <KubernetesLogo />,
            description: 'Kubernetes cluster',
        },
        {
            type: 'deploy_helm',
            label: 'Helm',
            logo: (
                <svg className='w-6 h-6' fill='#326CE5' viewBox='0 0 24 24'>
                    <path d='M12 0l1.873 6.127L20 6.127 15.064 9.873 16.937 16 12 12.254 7.063 16 8.936 9.873 4 6.127l6.127 0L12 0z' />
                </svg>
            ),
            description: 'Helm charts',
        },
        {
            type: 'deploy_aws',
            label: 'AWS',
            logo: <AWSLogo />,
            description: 'Amazon Web Services',
        },
        {
            type: 'deploy_gcp',
            label: 'Google Cloud',
            logo: (
                <svg className='w-6 h-6' fill='#4285F4' viewBox='0 0 24 24'>
                    <path d='M12.5 5.5v4l4-2-4-2zm-.5 6.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-2-8C7.6 4 5.6 5.4 4.8 7.4L8 9.6C8.4 8.1 9.8 7 11.5 7V4h.5-.5zm7.2 3.4C16.4 5.4 14.4 4 12 4v3c1.7 0 3.1 1.1 3.5 2.6l3.2-2.2-.5.5zM4.8 16.6C5.6 18.6 7.6 20 10 20v-3c-1.7 0-3.1-1.1-3.5-2.6L3.3 16.6l1.5-.5-.5.5zm12.4 0l-3.2-2.2c-.4 1.5-1.8 2.6-3.5 2.6v3c2.4 0 4.4-1.4 5.2-3.4l1.5.5-.5-.5z' />
                </svg>
            ),
            description: 'Google Cloud Platform',
        },
        {
            type: 'deploy_azure',
            label: 'Azure',
            logo: (
                <svg className='w-6 h-6' fill='#0078D4' viewBox='0 0 24 24'>
                    <path d='M5.483 21.469H0l3.781-12.375h5.483l-3.781 12.375zM13.5 2.531l-1.172 6.094H24L10.359 21.469l1.172-6.094H0L13.5 2.531z' />
                </svg>
            ),
            description: 'Microsoft Azure',
        },
    ],
    approval: [
        {
            type: 'approval_manual',
            label: 'Manual',
            logo: (
                <svg className='w-6 h-6' fill='#6B7280' viewBox='0 0 24 24'>
                    <path d='M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-6h-8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-8V5h8v6z' />
                </svg>
            ),
            description: 'Manual approval',
        },
        {
            type: 'approval_slack',
            label: 'Slack',
            logo: (
                <svg className='w-6 h-6' fill='#4A154B' viewBox='0 0 24 24'>
                    <path d='M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z' />
                </svg>
            ),
            description: 'Slack approval',
        },
        {
            type: 'approval_teams',
            label: 'Teams',
            logo: (
                <svg className='w-6 h-6' fill='#6264A7' viewBox='0 0 24 24'>
                    <path d='M20.625 5.25h-6c-.621 0-1.125.504-1.125 1.125v7.5c0 .621.504 1.125 1.125 1.125h6c.621 0 1.125-.504 1.125-1.125v-7.5c0-.621-.504-1.125-1.125-1.125zm-1.5 6.75h-3v-4.5h3v4.5zM9.375 9.75c1.035 0 1.875-.84 1.875-1.875s-.84-1.875-1.875-1.875-1.875.84-1.875 1.875.84 1.875 1.875 1.875zm0 1.125c-1.245 0-3.75.63-3.75 1.875v1.5h7.5v-1.5c0-1.245-2.505-1.875-3.75-1.875z' />
                </svg>
            ),
            description: 'Microsoft Teams',
        },
    ],
    release: [
        {
            type: 'release_docker',
            label: 'Docker',
            logo: <DockerLogo />,
            description: 'Docker containers',
        },
        {
            type: 'release_npm',
            label: 'NPM',
            logo: (
                <svg className='w-6 h-6' fill='#CB3837' viewBox='0 0 24 24'>
                    <path d='M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.331h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z' />
                </svg>
            ),
            description: 'NPM packages',
        },
        {
            type: 'release_maven',
            label: 'Maven',
            logo: (
                <svg className='w-6 h-6' fill='#C71A36' viewBox='0 0 24 24'>
                    <path d='M13.592 3.725L12 1.799 10.408 3.725 8.816 1.799 7.224 3.725 5.632 1.799 4.04 3.725 2.448 1.799.856 3.725v16.476L2.448 22.2l1.592-1.925L5.632 22.2l1.592-1.925L8.816 22.2l1.592-1.925L12 22.2l1.592-1.925L15.184 22.2l1.592-1.925L18.368 22.2l1.592-1.925L21.552 22.2l1.592-1.925V3.725L21.552 1.799 19.96 3.725 18.368 1.799 16.776 3.725 15.184 1.799z' />
                </svg>
            ),
            description: 'Maven artifacts',
        },
    ],
};

interface SidebarProps {
    onDragStart: (event: React.DragEvent, nodeType: WorkflowNodeType) => void;
}

export default function Sidebar({onDragStart}: SidebarProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null,
    );
    const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);

    const handleCategoryHover = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setIsConnectorsOpen(true);
    };

    const handleMouseLeave = () => {
        setIsConnectorsOpen(false);
        setSelectedCategory(null);
    };

    return (
        <div
            className='relative h-full transition-all duration-300 ease-in-out'
            style={{width: isConnectorsOpen ? '520px' : '240px'}}
            onMouseLeave={handleMouseLeave}
        >
            {/* First Panel - Categories (Medium Shade) */}
            <div
                className='absolute left-0 top-0 h-full bg-slate-700 text-white z-20 border-r border-slate-600/50'
                style={{width: '240px'}}
            >
                {/* Header */}
                <div className='p-4 border-b border-slate-600/50'>
                    <div className='flex items-center space-x-2 mb-3'>
                        <div className='w-2.5 h-2.5 rounded-full bg-accent-blue shadow-sm'></div>
                        <div className='w-2.5 h-2.5 rounded-full bg-accent-emerald shadow-sm'></div>
                        <div className='w-2.5 h-2.5 rounded-full bg-accent-rose shadow-sm'></div>
                    </div>
                    <h2 className='text-lg font-bold text-inverse mb-1'>
                        Connectors
                    </h2>
                    <p className='text-xs text-slate-400'>
                        Select a category to view connectors
                    </p>
                </div>

                {/* Categories List */}
                <div className='p-3 space-y-2 overflow-y-auto h-full pb-16'>
                    {workflowCategories.map((category) => (
                        <div
                            key={category.id}
                            onMouseEnter={() =>
                                handleCategoryHover(category.id)
                            }
                            className='group flex items-center justify-between p-3 rounded-xl bg-slate-600/60 hover:bg-slate-600/80 cursor-pointer transition-all duration-300 border border-slate-500/30 hover:border-slate-400/50 hover:shadow-lg'
                        >
                            <div className='flex items-center space-x-3'>
                                <div className='text-white'>
                                    {category.icon}
                                </div>
                                <div>
                                    <div className='font-semibold text-white group-hover:text-cyan-200 transition-colors'>
                                        {category.label}
                                    </div>
                                    <div className='text-xs text-slate-400 group-hover:text-slate-300 transition-colors'>
                                        {category.description}
                                    </div>
                                </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <span className='text-xs bg-slate-500/80 px-2.5 py-1 rounded-full text-slate-100 font-medium'>
                                    {category.count}
                                </span>
                                <svg
                                    className='w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-all duration-300 group-hover:translate-x-0.5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2.5}
                                        d='M9 5l7 7-7 7'
                                    />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Second Panel - Connectors (Very Light) */}
            <div
                className={`absolute top-0 h-full bg-slate-50 border-r border-slate-200 transition-all duration-300 ease-in-out z-10 shadow-xl ${
                    isConnectorsOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-full'
                }`}
                style={{
                    left: '240px',
                    width: '280px',
                    pointerEvents: isConnectorsOpen ? 'auto' : 'none',
                }}
            >
                {/* Header */}
                <div className='p-4 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50'>
                    <div>
                        <h3 className='font-bold text-primary capitalize'>
                            {selectedCategory} Connectors
                        </h3>
                        <p className='text-xs text-secondary mt-1'>
                            Drag and drop to canvas
                        </p>
                    </div>
                </div>

                {/* Connectors Grid */}
                <div className='p-3 space-y-3 overflow-y-auto h-full pb-16'>
                    {selectedCategory &&
                        connectorsByCategory[
                            selectedCategory as keyof typeof connectorsByCategory
                        ]?.map((connector) => (
                            <div
                                key={connector.type}
                                draggable
                                onDragStart={(e) =>
                                    onDragStart(
                                        e,
                                        connector.type as WorkflowNodeType,
                                    )
                                }
                                className='group flex items-center space-x-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100/50 hover:border-slate-300 cursor-move transition-all duration-300 hover:shadow-lg hover:scale-[1.02]'
                            >
                                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-white to-slate-100 flex items-center justify-center border border-slate-200 group-hover:scale-110 group-hover:shadow-md transition-all duration-300'>
                                    {connector.logo}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <div className='font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors'>
                                        {connector.label}
                                    </div>
                                    <div className='text-xs text-slate-600 truncate group-hover:text-slate-700 transition-colors'>
                                        {connector.description}
                                    </div>
                                </div>
                                <div className='opacity-0 group-hover:opacity-100 transition-all duration-300'>
                                    <svg
                                        className='w-4 h-4 text-slate-400 group-hover:text-indigo-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                                        />
                                    </svg>
                                </div>
                            </div>
                        ))}
                </div>

                {/* Instructions */}
                <div className='absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200'>
                    <div className='text-xs text-gray-600'>
                        <div className='font-medium mb-1'>How to use:</div>
                        <ul className='space-y-1'>
                            <li>• Hover over categories to view connectors</li>
                            <li>• Drag connectors to the canvas</li>
                            <li>
                                • Connect nodes by dragging from connection
                                points
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
