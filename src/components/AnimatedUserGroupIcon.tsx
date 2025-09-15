'use client';

import React from 'react';

interface AnimatedUserGroupIconProps {
    roleData: any;
    onAssignGroups: (roleData: any) => void;
    hasGroups?: boolean;
}

const AnimatedUserGroupIcon: React.FC<AnimatedUserGroupIconProps> = ({
    roleData,
    onAssignGroups,
    hasGroups = false,
}) => {
    return (
        <div className='flex items-center justify-center w-full h-full'>
            <button
                onClick={() => onAssignGroups(roleData)}
                className={`group relative p-3 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                    hasGroups
                        ? 'bg-green-50 border-2 border-green-200 hover:bg-green-100'
                        : 'bg-blue-50 border-2 border-blue-200 hover:bg-blue-100'
                }`}
                title={
                    hasGroups ? 'Manage assigned groups' : 'Assign user groups'
                }
            >
                {/* Animated SVG Icon */}
                <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    className={`transition-colors duration-300 ${
                        hasGroups ? 'text-green-600' : 'text-blue-600'
                    }`}
                >
                    {/* Main User */}
                    <circle
                        cx='12'
                        cy='8'
                        r='3'
                        stroke='currentColor'
                        strokeWidth='2'
                        className='animate-pulse'
                        style={{
                            animationDuration: '2s',
                            animationDelay: '0s',
                        }}
                    />
                    <path
                        d='M6 21V19C6 16.7909 8.68629 15 12 15C15.3137 15 18 16.7909 18 19V21'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='animate-pulse'
                        style={{
                            animationDuration: '2s',
                            animationDelay: '0.3s',
                        }}
                    />

                    {/* Secondary User (Left) */}
                    <circle
                        cx='5'
                        cy='6'
                        r='2'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        opacity='0.7'
                        className='animate-pulse'
                        style={{
                            animationDuration: '2s',
                            animationDelay: '0.6s',
                        }}
                    />
                    <path
                        d='M1 19V17C1 15.8954 2.11929 15 3.5 15C4.88071 15 6 15.8954 6 17'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        opacity='0.7'
                        className='animate-pulse'
                        style={{
                            animationDuration: '2s',
                            animationDelay: '0.9s',
                        }}
                    />

                    {/* Secondary User (Right) */}
                    <circle
                        cx='19'
                        cy='6'
                        r='2'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        opacity='0.7'
                        className='animate-pulse'
                        style={{
                            animationDuration: '2s',
                            animationDelay: '1.2s',
                        }}
                    />
                    <path
                        d='M18 17C18 15.8954 19.1193 15 20.5 15C21.8807 15 23 15.8954 23 17V19'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        opacity='0.7'
                        className='animate-pulse'
                        style={{
                            animationDuration: '2s',
                            animationDelay: '1.5s',
                        }}
                    />

                    {/* Connection Lines (Animated) */}
                    <line
                        x1='8'
                        y1='8'
                        x2='5'
                        y2='6'
                        stroke='currentColor'
                        strokeWidth='1'
                        opacity='0.5'
                        strokeDasharray='2,2'
                        className='animate-pulse'
                        style={{
                            animationDuration: '3s',
                            animationDelay: '0s',
                        }}
                    />
                    <line
                        x1='16'
                        y1='8'
                        x2='19'
                        y2='6'
                        stroke='currentColor'
                        strokeWidth='1'
                        opacity='0.5'
                        strokeDasharray='2,2'
                        className='animate-pulse'
                        style={{
                            animationDuration: '3s',
                            animationDelay: '1s',
                        }}
                    />
                </svg>

                {/* Group Count Badge (if has groups) */}
                {hasGroups && (
                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce'>
                        {roleData.assignedGroups?.length || '1'}
                    </div>
                )}

                {/* Plus Icon (if no groups) */}
                {!hasGroups && (
                    <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center group-hover:scale-125 transition-transform duration-200'>
                        <svg
                            width='10'
                            height='10'
                            viewBox='0 0 24 24'
                            fill='none'
                        >
                            <path
                                d='M12 5V19M5 12H19'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                    </div>
                )}

                {/* Hover Effect Glow */}
                <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm -z-10'></div>
            </button>
        </div>
    );
};

export default AnimatedUserGroupIcon;
