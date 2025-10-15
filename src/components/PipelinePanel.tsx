'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

interface PipelinePanelProps {
    isOpen: boolean;
    onClose: () => void;
    sidebarWidth?: number; // Width of the main sidebar
}

// Inline SVG background illustrations for cards
const BgStack = () => (
    <svg
        className='absolute inset-0 w-full h-full opacity-20'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4Z'
            fill='url(#gradient1)'
        />
        <defs>
            <linearGradient id='gradient1' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#3B82F6' />
                <stop offset='100%' stopColor='#1E40AF' />
            </linearGradient>
        </defs>
    </svg>
);

const BgTemplate = () => (
    <svg
        className='absolute inset-0 w-full h-full opacity-20'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M3 3H21C21.55 3 22 3.45 22 4V8C22 8.55 21.55 9 21 9H3C2.45 9 2 8.55 2 8V4C2 3.45 2.45 3 3 3Z'
            fill='url(#gradient2)'
        />
        <path
            d='M3 11H21C21.55 11 22 11.45 22 12V16C22 16.55 21.55 17 21 17H3C2.45 17 2 16.55 2 16V12C2 11.45 2.45 11 3 11Z'
            fill='url(#gradient2)'
        />
        <path
            d='M3 19H21C21.55 19 22 19.45 22 20V20C22 20.55 21.55 21 21 21H3C2.45 21 2 20.55 2 20V20C2 19.45 2.45 19 3 19Z'
            fill='url(#gradient2)'
        />
        <defs>
            <linearGradient id='gradient2' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#10B981' />
                <stop offset='100%' stopColor='#059669' />
            </linearGradient>
        </defs>
    </svg>
);

const BgAI = () => (
    <svg
        className='absolute inset-0 w-full h-full opacity-20'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <circle cx='12' cy='12' r='8' fill='url(#gradient3)' />
        <path
            d='M12 2L13.09 8.26L18 7L16.74 12L21 12L14.74 13.09L16 18L12 16.74L8 18L9.26 13.09L3 12L7.26 12L8.26 7L12 2Z'
            fill='white'
            fillOpacity='0.8'
        />
        <defs>
            <linearGradient id='gradient3' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#8B5CF6' />
                <stop offset='100%' stopColor='#6D28D9' />
            </linearGradient>
        </defs>
    </svg>
);

const pipelineCards = [
    {
        id: 'pipeline-canvas',
        title: 'Pipeline Canvas',
        href: '/pipelines/summary',
        bgColor: 'bg-blue-50',
        bgIllustration: <BgStack />,
    },
    {
        id: 'pipeline-templates',
        title: 'Pipeline Templates',
        href: '/pipelines/templates',
        bgColor: 'bg-green-50',
        bgIllustration: <BgTemplate />,
    },
    {
        id: 'ai-smart-pipeline',
        title: 'AI Powered Smart Pipeline',
        href: '/pipelines/smart',
        bgColor: 'bg-purple-50',
        bgIllustration: <BgAI />,
    },
];

export default function PipelinePanel({
    isOpen,
    onClose,
    sidebarWidth = 256, // Default to 256px (w-64)
}: PipelinePanelProps) {
    const router = useRouter();

    const handleCardClick = (cardId: string, href: string) => {
        onClose(); // Close the panel first

        switch (cardId) {
            case 'pipeline-canvas':
                router.push('/pipelines/summary');
                break;
            case 'pipeline-templates':
                router.push('/pipelines/templates');
                break;
            case 'ai-smart-pipeline':
                router.push('/pipelines/smart');
                break;
            default:
                router.push(href);
                console.log(`Navigate to ${cardId}`);
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

            {/* Pipeline Panel - Positioned to the right of main sidebar */}
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
                            Pipelines
                        </h2>
                        <p className='text-[10px] text-slate-600 mt-1'>
                            Manage your CI/CD workflows
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

                {/* Pipeline Content */}
                <div
                    className='p-3 space-y-2 overflow-auto'
                    style={{height: 'calc(100% - 60px)'}}
                >
                    {pipelineCards.map((card, index) => (
                        <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id, card.href)}
                            className={`group relative overflow-hidden rounded-lg p-2 cursor-pointer border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50/30 hover:to-white`}
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
