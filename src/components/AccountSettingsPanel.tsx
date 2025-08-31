'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';

interface AccountSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sidebarWidth?: number; // Width of the main sidebar
}

// Inline SVG background illustrations for cards
const BgStack = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 saturate-150 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='as-stack' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#60A5FA' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#A78BFA' stopOpacity='0.05' />
            </linearGradient>
        </defs>
        <g fill='url(#as-stack)'>
            <path d='M64 10l48 22-48 22L16 32 64 10z' />
            <path d='M64 40l40 18-40 18L24 58 64 40z' opacity='0.6' />
            <path d='M112 72L64 94 16 72v14l48 22 48-22V72z' />
        </g>
    </svg>
);

const BgUserGear = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='as-accounts' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#10B981' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#34D399' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#as-accounts)'>
            <rect x='26' y='40' width='76' height='50' rx='10' />
            <circle cx='48' cy='64' r='12' fill='#10B98122' />
            <rect x='62' y='58' width='30' height='6' rx='3' />
            <rect x='62' y='70' width='36' height='6' rx='3' />
        </g>
    </svg>
);

const BgPiggy = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='as-bu' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#FB7185' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#F59E0B' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#as-bu)'>
            <rect x='28' y='56' width='34' height='36' rx='4' />
            <rect x='66' y='46' width='34' height='46' rx='4' />
            <rect x='36' y='64' width='8' height='8' rx='2' fill='#FB718533' />
            <rect x='36' y='76' width='8' height='8' rx='2' fill='#FB718533' />
            <rect
                x='74'
                y='54'
                width='10'
                height='10'
                rx='2'
                fill='#F59E0B33'
            />
            <rect
                x='88'
                y='54'
                width='10'
                height='10'
                rx='2'
                fill='#F59E0B33'
            />
        </g>
    </svg>
);

const BgGlobe = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='as-globe' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#8B5CF6' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#EC4899' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='none' stroke='url(#as-globe)' strokeWidth='3'>
            <circle cx='64' cy='64' r='28' />
            <ellipse cx='64' cy='64' rx='18' ry='28' />
            <ellipse cx='64' cy='64' rx='28' ry='14' />
        </g>
    </svg>
);

// Settings card data
const settingsCards = [
    {
        id: 'enterprise-config',
        title: 'Enterprise Configuration',
        description: 'Manage enterprise-wide settings and configurations',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z' />
            </svg>
        ),
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        bgIllustration: <BgStack />,
    },
    {
        id: 'manage-accounts',
        title: 'Manage Accounts',
        description: 'User accounts and permissions management',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
            </svg>
        ),
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        bgIllustration: <BgUserGear />,
    },
    {
        id: 'business-unit-settings',
        title: 'Business Unit Settings',
        description: 'Configure business unit specific settings',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z' />
            </svg>
        ),
        bgColor: 'bg-pink-50',
        iconColor: 'text-pink-600',
        bgIllustration: <BgPiggy />,
    },
    {
        id: 'global-settings',
        title: 'Global Settings',
        description: 'System-wide configuration and preferences',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
            </svg>
        ),
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        bgIllustration: <BgGlobe />,
    },
];

export default function AccountSettingsPanel({
    isOpen,
    onClose,
    sidebarWidth = 256, // Default to 256px (w-64)
}: AccountSettingsPanelProps) {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const router = useRouter();

    const handleCardClick = (cardId: string) => {
        setSelectedCard(cardId);

        // Navigation logic for each card
        switch (cardId) {
            case 'enterprise-config':
                router.push('/account-settings/enterprise-configuration');
                onClose(); // Close the panel after navigation
                break;
            case 'manage-accounts':
                router.push('/account-settings/manage-accounts');
                onClose(); // Close the panel after navigation
                break;
            case 'business-unit-settings':
                router.push('/account-settings/business-unit-settings');
                onClose();
                break;
            case 'global-settings':
                router.push('/account-settings/global-settings');
                onClose();
                break;
            default:
                console.log(`Navigate to ${cardId}`);
        }
    }

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

            {/* Settings Panel - Positioned to the right of main sidebar */}
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
                            Account Settings
                        </h2>
                        <p className='text-[10px] text-slate-600 mt-1'>
                            Manage your configuration & preferences
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

                {/* Settings Content */}
                <div className='p-3 space-y-2 overflow-auto' style={{ height: 'calc(100% - 60px)' }}>
                    {settingsCards.map((card, index) => (
                        <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className={`group relative overflow-hidden rounded-lg p-2 cursor-pointer border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50/30 hover:to-white ${
                                selectedCard === card.id
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
                                className={`absolute inset-0 ${card.bgColor} opacity-30 group-hover:opacity-80 group-hover:brightness-90 transition-all`}
                            />
                            {/* Card-specific illustration */}
                            {card.bgIllustration}

                            {/* Content: title only */}
                            <div className='relative z-10'>
                                <h3 className='text-[10px] font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors'>
                                    {card.title}
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
