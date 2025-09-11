'use client';

import React from 'react';

interface RolesCountCellProps {
    groupData: any;
    onManageRoles: (groupData: any) => void;
    roleCount?: number;
}

const RolesCountCell: React.FC<RolesCountCellProps> = ({
    groupData,
    onManageRoles,
    roleCount = 0,
}) => {
    const hasRoles = roleCount > 0;

    return (
        <div className='flex items-center justify-center w-full h-full'>
            <button
                onClick={() => onManageRoles(groupData)}
                className={`group relative p-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    hasRoles
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'bg-gray-50 hover:bg-blue-50'
                }`}
                title={
                    hasRoles
                        ? `${roleCount} role(s) assigned - Click to manage`
                        : 'No roles assigned - Click to assign'
                }
            >
                {/* Role-Meaningful SVG Icon */}
                <div className='relative'>
                    <svg
                        width='22'
                        height='22'
                        viewBox='0 0 24 24'
                        fill='none'
                        className={`transition-all duration-300 ${
                            hasRoles ? 'text-blue-600' : 'text-gray-400'
                        }`}
                    >
                        {hasRoles ? (
                            // Document with role/permission icon
                            <g>
                                {/* Document background */}
                                <rect
                                    x='4'
                                    y='3'
                                    width='14'
                                    height='18'
                                    rx='2'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    fill='none'
                                    className='animate-pulse'
                                    style={{animationDuration: '2s'}}
                                />

                                {/* Document lines (role entries) */}
                                <g
                                    stroke='currentColor'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                    opacity='0.6'
                                >
                                    <line x1='7' y1='8' x2='15' y2='8' />
                                    <line x1='7' y1='11' x2='13' y2='11' />
                                    <line x1='7' y1='14' x2='14' y2='14' />
                                </g>

                                {/* Role/permission badge */}
                                <g
                                    className='animate-pulse'
                                    style={{
                                        animationDuration: '1.8s',
                                        animationDelay: '0.3s',
                                    }}
                                >
                                    <circle
                                        cx='15'
                                        cy='17'
                                        r='3'
                                        fill='#3B82F6'
                                        opacity='0.9'
                                    />
                                    <path
                                        d='M13.5 17L14.5 18L16.5 16'
                                        stroke='white'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </g>
                            </g>
                        ) : (
                            // Empty document with plus
                            <g opacity='0.7'>
                                {/* Document background */}
                                <rect
                                    x='4'
                                    y='3'
                                    width='14'
                                    height='18'
                                    rx='2'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    fill='none'
                                    strokeDasharray='3,2'
                                    className='animate-pulse'
                                    style={{animationDuration: '2s'}}
                                />

                                {/* Plus icon in center */}
                                <g
                                    className='animate-pulse'
                                    style={{animationDuration: '2.5s'}}
                                >
                                    <circle
                                        cx='12'
                                        cy='12'
                                        r='3'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        fill='none'
                                        strokeDasharray='2,1'
                                    />
                                    <path
                                        d='M12 10V14M10 12H14'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                    />
                                </g>
                            </g>
                        )}
                    </svg>

                    {/* Count Badge */}
                    {hasRoles && (
                        <div className='absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm'>
                            {roleCount}
                        </div>
                    )}
                </div>

                {/* Simple Hover Effect */}
                <div className='absolute inset-0 rounded-lg bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
            </button>
        </div>
    );
};

export default RolesCountCell;
