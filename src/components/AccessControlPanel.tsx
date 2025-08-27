'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';

interface AccessControlPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sidebarWidth?: number;
}

// Inline SVG backgrounds for Access Control cards
const BgUsers = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <g fill='#60A5FA33'>
            <circle cx='44' cy='52' r='16' />
            <circle cx='78' cy='48' r='12' />
            <path d='M18 92c0-12 10-22 22-22s22 10 22 22v8H18v-8z' />
            <path d='M62 92c0-9 8-16 16-16s16 7 16 16v6H62v-6z' />
        </g>
    </svg>
);

const BgGroup = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <g fill='#FBBF2433'>
            <rect x='30' y='70' width='68' height='30' rx='6' />
            <circle cx='40' cy='60' r='10' />
            <circle cx='64' cy='56' r='12' />
            <circle cx='88' cy='60' r='10' />
        </g>
    </svg>
);

const BgShield = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <path
            d='M64 16l36 12v22c0 26-16 40-36 50-20-10-36-24-36-50V28l36-12z'
            fill='#34D39933'
        />
        <path
            d='M46 66l10 10 26-26'
            stroke='#10B981'
            strokeWidth='6'
            fill='none'
        />
    </svg>
);

const BgHierarchy = () => (
    <svg
        viewBox='0 0 128 128'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-60 transition-all duration-300 transform group-hover:opacity-100 group-hover:saturate-200 group-hover:brightness-200 group-hover:scale-120 drop-shadow-md group-hover:drop-shadow-xl'
    >
        <g stroke='#A78BFA66' strokeWidth='4' fill='none'>
            <rect x='56' y='24' width='16' height='16' rx='3' />
            <rect x='24' y='72' width='16' height='16' rx='3' />
            <rect x='56' y='72' width='16' height='16' rx='3' />
            <rect x='88' y='72' width='16' height='16' rx='3' />
            <path d='M64 40v16M64 56H32M64 56h32' />
        </g>
    </svg>
);

const cards = [
    {
        id: 'manage-users',
        title: 'Manage Users',
        description: 'Create, edit, deactivate users',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-7 9v-1c0-3.31 2.69-6 6-6h2c3.31 0 6 2.69 6 6v1H5z' />
            </svg>
        ),
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        href: '/access-control/manage-users',
        bgIllustration: <BgUsers />,
    },
    {
        id: 'manage-user-groups',
        title: 'Manage User Groups',
        description: 'Organize users into groups and teams',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-2.66-5.33-4-8-4zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45v1.5H24V17c0-2.66-5.33-4-8-4z' />
            </svg>
        ),
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-600',
        href: '/access-control/manage-user-groups',
        bgIllustration: <BgGroup />,
    },
    {
        id: 'manage-roles',
        title: 'Manage Roles',
        description: 'Define roles and permissions',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5-1 0z' />
            </svg>
        ),
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        href: '/access-control/manage-roles',
        bgIllustration: <BgShield />,
    },
    {
        id: 'role-user-hierarchy',
        title: 'Role-User Hierarchy',
        description: 'Visualize and manage hierarchies',
        icon: (
            <svg className='w-8 h-8' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M10 3h4v4h-4zM4 17h4v4H4zm12 0h4v4h-4zM6 7h12v4H6zm6 4v6' />
            </svg>
        ),
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        href: '/access-control/role-user-hierarchy',
        bgIllustration: <BgHierarchy />,
    },
];

export default function AccessControlPanel({
    isOpen,
    onClose,
    sidebarWidth = 256,
}: AccessControlPanelProps) {
    const router = useRouter();
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    const handleCardClick = (id: string, href: string) => {
        setSelectedCard(id);
        router.push(href);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
                    isOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
                }`}
                style={{left: `${sidebarWidth}px`}}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`fixed top-0 h-full bg-gradient-to-b from-indigo-50/70 via-white to-indigo-100/50 shadow-2xl transform transition-all duration-300 ease-in-out z-50 border-r border-light backdrop-blur-xl ${
                    isOpen
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 pointer-events-none'
                }`}
                style={{left: `${sidebarWidth}px`, width: '192px'}}
                aria-hidden={!isOpen}
            >
                <div className='flex items-center justify-between p-5 border-b border-light bg-gradient-to-r from-slate-50 to-white'>
                    <div>
                        <h2 className='text-lg font-bold text-primary'>
                            Access Control
                        </h2>
                        <p className='text-xs text-secondary mt-1'>
                            Manage users, groups and roles
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className='p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200'
                    >
                        <svg
                            className='w-5 h-5 text-tertiary'
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

                <div className='p-5 space-y-3 overflow-y-auto h-full pb-20'>
                    {cards.map((card, index) => (
                        <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id, card.href)}
                            className={`group relative overflow-hidden rounded-2xl p-3 cursor-pointer border border-light bg-white transition-all duration-300 hover:shadow-2xl hover:border-primary/60 ${
                                selectedCard === card.id
                                    ? 'ring-2 ring-primary/60'
                                    : ''
                            }`}
                            style={{
                                animationDelay: `${index * 100}ms`,
                                animation: isOpen
                                    ? 'slideInFromLeft 0.5s ease-out forwards'
                                    : 'none',
                                height: '118px',
                            }}
                        >
                            <div
                                className={`absolute inset-0 ${card.bgColor} opacity-30 group-hover:opacity-80 group-hover:brightness-90 transition-all`}
                            />
                            {card.bgIllustration}
                            <div className='relative z-10'>
                                <h3 className='text-xs font-semibold text-primary group-hover:text-brand-dark transition-colors'>
                                    {card.title}
                                </h3>
                            </div>
                            <div className='absolute inset-0 bg-gradient-to-br from-primary-light/0 via-primary-light/10 to-primary-light/0 opacity-0 group-hover:opacity-100 transition-opacity' />
                        </div>
                    ))}
                </div>

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
            </div>
        </>
    );
}
