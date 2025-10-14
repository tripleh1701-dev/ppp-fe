'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';

interface BuildsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sidebarWidth?: number;
}

// Inline SVG background illustrations for cards
const BgIntegrations = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 saturate-150 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient
                id='builds-integrations'
                x1='0'
                y1='0'
                x2='1'
                y2='1'
            >
                <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#6366F1' stopOpacity='0.05' />
            </linearGradient>
        </defs>
        <g fill='url(#builds-integrations)'>
            <circle cx='30' cy='64' r='12' />
            <circle cx='64' cy='64' r='12' />
            <circle cx='98' cy='64' r='12' />
            <rect x='40' y='62' width='20' height='4' rx='2' />
            <rect x='72' y='62' width='20' height='4' rx='2' />
        </g>
    </svg>
);

const BgExtensions = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='builds-extensions' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#10B981' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#34D399' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#builds-extensions)'>
            <rect x='34' y='34' width='60' height='60' rx='8' />
            <rect
                x='44'
                y='44'
                width='16'
                height='16'
                rx='4'
                fill='#10B98122'
            />
            <rect
                x='64'
                y='44'
                width='16'
                height='16'
                rx='4'
                fill='#10B98122'
            />
            <rect
                x='44'
                y='64'
                width='16'
                height='16'
                rx='4'
                fill='#10B98122'
            />
            <rect
                x='64'
                y='64'
                width='16'
                height='16'
                rx='4'
                fill='#10B98122'
            />
        </g>
    </svg>
);

const BgDeployments = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <defs>
            <linearGradient id='builds-deployments' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#F59E0B' stopOpacity='0.25' />
                <stop offset='100%' stopColor='#EF4444' stopOpacity='0.08' />
            </linearGradient>
        </defs>
        <g fill='url(#builds-deployments)'>
            <path d='M64 20 L85 40 L85 90 L64 108 L43 90 L43 40 Z' />
            <path
                d='M64 45 L50 55 L50 75 L64 85 L78 75 L78 55 Z'
                opacity='0.5'
            />
        </g>
    </svg>
);

// Builds card data
const buildsCards = [
    {
        id: 'integrations',
        title: 'Integrations',
        description: 'Manage system integrations and connectors',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
            </svg>
        ),
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        bgIllustration: <BgIntegrations />,
    },
    {
        id: 'extensions',
        title: 'Extensions',
        description: 'Manage extensions and plugins',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z' />
            </svg>
        ),
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        bgIllustration: <BgExtensions />,
    },
    {
        id: 'deployments',
        title: 'Deployments',
        description: 'Manage cloud deployments',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z' />
            </svg>
        ),
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        bgIllustration: <BgDeployments />,
    },
];

export default function BuildsPanel({
    isOpen,
    onClose,
    sidebarWidth = 256,
}: BuildsPanelProps) {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const router = useRouter();

    const handleCardClick = (cardId: string) => {
        setSelectedCard(cardId);

        // Navigation logic for each card
        switch (cardId) {
            case 'integrations':
                router.push('/builds/integrations');
                onClose();
                break;
            case 'extensions':
                router.push('/builds/extensions');
                onClose();
                break;
            case 'deployments':
                router.push('/builds/deployments');
                onClose();
                break;
            default:
                console.log(`Navigate to ${cardId}`);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
                    isOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
                }`}
                style={{
                    left: `${sidebarWidth}px`,
                }}
                onClick={onClose}
            />

            {/* Builds Panel */}
            <div
                className={`fixed top-0 h-full bg-gradient-to-b from-blue-50/70 via-white to-blue-100/50 shadow-2xl transform transition-all duration-300 ease-in-out z-50 border-r border-light backdrop-blur-xl ${
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
                            Builds
                        </h2>
                        <p className='text-[10px] text-slate-600 mt-1'>
                            Manage your integrations, extensions & deployments
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

                {/* Builds Content */}
                <div
                    className='p-3 space-y-2 overflow-auto'
                    style={{height: 'calc(100% - 60px)'}}
                >
                    {buildsCards.map((card, index) => (
                        <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className={`group relative overflow-hidden rounded-lg p-2 cursor-pointer border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-white ${
                                selectedCard === card.id
                                    ? 'ring-2 ring-blue-300'
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
                            {/* Darken tint on hover */}
                            <div
                                className={`absolute inset-0 ${card.bgColor} opacity-30 group-hover:opacity-80 group-hover:brightness-90 transition-all`}
                            />
                            {/* Card-specific illustration */}
                            {card.bgIllustration}

                            {/* Content: title only */}
                            <div className='relative z-10'>
                                <h3 className='text-[10px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors'>
                                    {card.title}
                                </h3>
                            </div>

                            {/* Modern Hover Effect */}
                            <div className='absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
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
                                className='text-blue-600 hover:text-blue-500 font-medium transition-colors'
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
