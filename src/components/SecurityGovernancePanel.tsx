'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';

interface SecurityGovernancePanelProps {
    isOpen: boolean;
    onClose: () => void;
    sidebarWidth?: number; // Width of the main sidebar
}

// Inline SVG background illustrations for cards
const BgCredentials = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 saturate-150 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='sg-credentials' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#10B981' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#34D399' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#sg-credentials)'>
            <rect x='32' y='45' width='64' height='38' rx='8' />
            <circle cx='48' cy='64' r='8' fill='#10B98122' />
            <rect x='60' y='58' width='28' height='4' rx='2' />
            <rect x='60' y='66' width='32' height='4' rx='2' />
            <rect x='60' y='74' width='20' height='4' rx='2' />
        </g>
    </svg>
);

const BgConnectors = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='sg-connectors' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#60A5FA' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#sg-connectors)'>
            <rect x='40' y='50' width='48' height='28' rx='6' />
            <circle cx='48' cy='58' r='3' fill='#3B82F622' />
            <circle cx='80' cy='58' r='3' fill='#3B82F622' />
            <circle cx='48' cy='70' r='3' fill='#3B82F622' />
            <circle cx='80' cy='70' r='3' fill='#3B82F622' />
            <path
                d='M20 64H40M88 64H108'
                stroke='#3B82F6'
                strokeWidth='4'
                strokeLinecap='round'
            />
        </g>
    </svg>
);

const BgEnvironments = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='sg-environments' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#8B5CF6' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#A78BFA' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#sg-environments)'>
            <rect x='30' y='40' width='68' height='48' rx='8' />
            <rect
                x='36'
                y='48'
                width='16'
                height='12'
                rx='4'
                fill='#8B5CF633'
            />
            <rect
                x='56'
                y='48'
                width='16'
                height='12'
                rx='4'
                fill='#8B5CF633'
            />
            <rect
                x='76'
                y='48'
                width='16'
                height='12'
                rx='4'
                fill='#8B5CF633'
            />
            <rect x='36' y='68' width='56' height='4' rx='2' fill='#8B5CF644' />
            <rect x='36' y='76' width='40' height='4' rx='2' fill='#8B5CF644' />
        </g>
    </svg>
);

const BgWebhooks = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='sg-webhooks' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#F59E0B' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#FCD34D' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#sg-webhooks)'>
            <circle cx='64' cy='64' r='24' />
            <path
                d='M50 50L78 78M78 50L50 78'
                stroke='#F59E0B'
                strokeWidth='3'
                strokeLinecap='round'
            />
            <circle cx='40' cy='40' r='6' fill='#F59E0B44' />
            <circle cx='88' cy='40' r='6' fill='#F59E0B44' />
            <circle cx='40' cy='88' r='6' fill='#F59E0B44' />
            <circle cx='88' cy='88' r='6' fill='#F59E0B44' />
        </g>
    </svg>
);

const BgNotifications = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='sg-notifications' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#8B5CF6' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#A78BFA' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#sg-notifications)'>
            <path d='M64 20c-8 0-14 6-14 14v16c0 12-6 18-12 24h52c-6-6-12-12-12-24V34c0-8-6-14-14-14z' />
            <path
                d='M58 80c0 3 3 6 6 6s6-3 6-6'
                stroke='#8B5CF6'
                strokeWidth='2'
                fill='none'
            />
            <circle cx='84' cy='28' r='6' fill='#8B5CF6' opacity='0.8' />
            <circle cx='84' cy='28' r='3' fill='#ffffff' />
            <path
                d='M64 16v8M48 24l4 4M80 24l-4 4'
                stroke='#8B5CF644'
                strokeWidth='2'
                strokeLinecap='round'
            />
        </g>
    </svg>
);

const BgLintingRules = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='sg-linting' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#EF4444' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#F87171' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#sg-linting)'>
            <rect x='24' y='32' width='80' height='64' rx='8' />
            <path
                d='M32 48h64M32 56h48M32 64h56M32 72h40M32 80h52'
                stroke='#EF4444'
                strokeWidth='2'
                opacity='0.6'
            />
            <circle cx='96' cy='40' r='8' fill='#EF4444' />
            <path
                d='M92 40l3 3 6-6'
                stroke='white'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
            <circle cx='104' cy='56' r='6' fill='#F59E0B' opacity='0.8' />
            <path
                d='M102 56h4'
                stroke='white'
                strokeWidth='2'
                strokeLinecap='round'
            />
        </g>
    </svg>
);

// Security & Governance options data
const securityGovernanceOptions = [
    {
        id: 'credential-manager',
        title: 'Credential Manager',
        description:
            'Enterprise credential vault for secure API keys and authentication tokens',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 1L3 5v6c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' />
            </svg>
        ),
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        bgIllustration: <BgCredentials />,
        href: '/security-governance/credentials',
    },
    {
        id: 'connectors',
        title: 'Connectors',
        description:
            'Enterprise system integrations and secure service connections',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2z' />
                <path d='M8 13h8v-2H8v2z' />
            </svg>
        ),
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        bgIllustration: <BgConnectors />,
        href: '/security-governance/connectors',
    },
    {
        id: 'environments',
        title: 'Environments',
        description:
            'Enterprise environment management and deployment configurations',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
            </svg>
        ),
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        bgIllustration: <BgEnvironments />,
        href: '/security-governance/environments',
    },
    {
        id: 'webhooks',
        title: 'Webhooks',
        description:
            'Enterprise webhook management and automated event notifications',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24zm2.82-4.24c.39-.39 1.03-.39 1.42 0a5.003 5.003 0 0 1 0 7.07l-3.54 3.54a5.003 5.003 0 0 1-7.07 0 5.003 5.003 0 0 1 0-7.07l1.49-1.49c-.01.82.12 1.64.4 2.43l-.47.47a2.982 2.982 0 0 0 0 4.24 2.982 2.982 0 0 0 4.24 0l3.53-3.53a2.982 2.982 0 0 0 0-4.24.996.996 0 0 1 0-1.42z' />
            </svg>
        ),
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-600',
        bgIllustration: <BgWebhooks />,
        href: '/security-governance/webhooks',
    },
    {
        id: 'notifications',
        title: 'Notifications',
        description:
            'Security alerts, compliance notifications and system event management',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' />
            </svg>
        ),
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        bgIllustration: <BgNotifications />,
        href: '/security-governance/notifications',
    },
    {
        id: 'linting-rules',
        title: 'Linting Rules',
        description:
            'Code quality standards, security linting rules and compliance validation',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
                <path
                    d='M10,12L8,14L10,16M14,12L16,14L14,16'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
            </svg>
        ),
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        bgIllustration: <BgLintingRules />,
        href: '/security-governance/linting-rules',
    },
];

export default function SecurityGovernancePanel({
    isOpen,
    onClose,
    sidebarWidth = 256, // Default to 256px (w-64)
}: SecurityGovernancePanelProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const router = useRouter();

    const handleOptionClick = (optionId: string) => {
        setSelectedOption(optionId);

        // Navigation logic for each option
        const option = securityGovernanceOptions.find(
            (opt) => opt.id === optionId,
        );
        if (option) {
            router.push(option.href);
            onClose(); // Close the panel after navigation
        }
    };

    return (
        <>
            {/* Backdrop - covers main content area only, not the sidebar */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
                    isOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
                }`}
                style={{
                    left: `${sidebarWidth}px`, // Start backdrop after sidebar
                }}
                onClick={onClose}
            />

            {/* Security & Governance Panel - Positioned to the right of main sidebar */}
            <div
                className={`fixed top-0 h-full bg-gradient-to-b from-indigo-50/70 via-white to-indigo-100/50 shadow-2xl transform transition-all duration-300 ease-in-out z-50 border-r border-light backdrop-blur-xl ${
                    isOpen
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 pointer-events-none'
                }`}
                style={{
                    left: `${sidebarWidth}px`,
                    width: '160px',
                }}
                aria-hidden={!isOpen}
            >
                {/* Header */}
                <div className='flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white'>
                    <div>
                        <h2 className='text-sm font-bold text-slate-800'>
                            Security & Governance
                        </h2>
                        <p className='text-[10px] text-slate-600 mt-1'>
                            Enterprise security & compliance management
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className='p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group'
                    >
                        <svg
                            className='w-5 h-5 text-slate-600 group-hover:text-red-600 transition-colors duration-200'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>
                </div>

                {/* Security & Governance Options Content */}
                <div
                    className='p-3 space-y-2 overflow-auto'
                    style={{height: 'calc(100% - 60px)'}}
                >
                    {securityGovernanceOptions.map((option, index) => (
                        <div
                            key={option.id}
                            onClick={() => handleOptionClick(option.id)}
                            className={`group relative overflow-hidden rounded-lg p-2 cursor-pointer border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50/30 hover:to-white ${
                                selectedOption === option.id
                                    ? 'ring-2 ring-indigo-300'
                                    : ''
                            }`}
                            style={{
                                animationDelay: `${index * 100}ms`,
                                animation: isOpen
                                    ? 'slideInFromLeft 0.5s ease-out forwards'
                                    : 'none',
                                height: '88px',
                            }}
                        >
                            {/* Darken tint on hover so image pops */}
                            <div
                                className={`absolute inset-0 ${option.bgColor} opacity-30 group-hover:opacity-80 group-hover:brightness-90 transition-all`}
                            />
                            {/* Option-specific illustration */}
                            {option.bgIllustration}

                            {/* Content: title only */}
                            <div className='relative z-10'>
                                <h3 className='text-[10px] font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors'>
                                    {option.title}
                                </h3>
                            </div>

                            {/* Modern Hover Effect */}
                            <div className='absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/5 to-indigo-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className='absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card via-card to-transparent'>
                    <div className='text-center'>
                        <p className='text-[10px] text-slate-500'>
                            Need help? Contact{' '}
                            <a
                                href='#'
                                className='text-indigo-600 hover:text-indigo-500 font-medium transition-colors'
                            >
                                Support
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* CSS Animation Styles */}
            <style jsx>{`
                @keyframes slideInFromLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
}
