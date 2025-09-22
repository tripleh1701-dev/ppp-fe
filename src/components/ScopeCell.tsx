'use client';

import React from 'react';

interface ScopeCellProps {
    roleData: any;
    onConfigureScope: (roleData: any) => void;
}

const ScopeCell: React.FC<ScopeCellProps> = ({roleData, onConfigureScope}) => {
    // Only consider scope as configured if it has the 'configured' flag set to true
    // This flag will be set when user clicks "Apply Changes" in the scope modal
    const hasScope = roleData.scope && roleData.scope.configured === true;

    return (
        <div className='flex items-center justify-center w-full h-full'>
            <div className='flex items-center justify-center'>
                <button
                    onClick={() => onConfigureScope(roleData)}
                    className={`p-2 rounded-lg transition-all duration-300 border-2 transform hover:scale-105 ${
                        hasScope
                            ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 shadow-green-200 shadow-lg'
                            : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 shadow-blue-200 shadow-lg'
                    }`}
                    title={
                        hasScope
                            ? 'Scope configured - Click to modify'
                            : 'Click to configure scope'
                    }
                >
                    <svg
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        className={`transition-colors duration-300 ${
                            hasScope ? 'text-green-600' : 'text-blue-600'
                        }`}
                    >
                        {/* Outer ring with pulse animation */}
                        <circle
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='2'
                            className={`transition-all duration-500 animate-pulse ${
                                hasScope
                                    ? 'stroke-green-600'
                                    : 'stroke-blue-500'
                            }`}
                            style={{
                                animationDuration: '3s',
                                animationDelay: '0s',
                            }}
                        />

                        {/* Middle ring with rotating dash effect */}
                        <circle
                            cx='12'
                            cy='12'
                            r='6'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeDasharray='8,4'
                            className={`transition-all duration-500 animate-spin ${
                                hasScope
                                    ? 'stroke-green-500'
                                    : 'stroke-blue-400'
                            }`}
                            style={{
                                animationDuration: '8s',
                                animationDirection: 'reverse',
                            }}
                        />

                        {/* Center dot with scale animation */}
                        <circle
                            cx='12'
                            cy='12'
                            r='2'
                            fill='currentColor'
                            className={`transition-all duration-500 animate-pulse ${
                                hasScope ? 'fill-green-600' : 'fill-blue-600'
                            }`}
                            style={{
                                animationDuration: '2s',
                                animationDelay: '0.5s',
                            }}
                        />

                        {/* Crosshair lines for targeting effect */}
                        <line
                            x1='12'
                            y1='2'
                            x2='12'
                            y2='6'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            className={`transition-all duration-500 animate-pulse ${
                                hasScope
                                    ? 'stroke-green-500'
                                    : 'stroke-blue-500'
                            }`}
                            style={{
                                animationDuration: '2.5s',
                                animationDelay: '1s',
                            }}
                        />
                        <line
                            x1='12'
                            y1='18'
                            x2='12'
                            y2='22'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            className={`transition-all duration-500 animate-pulse ${
                                hasScope
                                    ? 'stroke-green-500'
                                    : 'stroke-blue-500'
                            }`}
                            style={{
                                animationDuration: '2.5s',
                                animationDelay: '1.2s',
                            }}
                        />
                        <line
                            x1='2'
                            y1='12'
                            x2='6'
                            y2='12'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            className={`transition-all duration-500 animate-pulse ${
                                hasScope
                                    ? 'stroke-green-500'
                                    : 'stroke-blue-500'
                            }`}
                            style={{
                                animationDuration: '2.5s',
                                animationDelay: '1.4s',
                            }}
                        />
                        <line
                            x1='18'
                            y1='12'
                            x2='22'
                            y2='12'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            className={`transition-all duration-500 animate-pulse ${
                                hasScope
                                    ? 'stroke-green-500'
                                    : 'stroke-blue-500'
                            }`}
                            style={{
                                animationDuration: '2.5s',
                                animationDelay: '1.6s',
                            }}
                        />

                        {/* Success checkmark badge (only when configured) */}
                        {hasScope && (
                            <>
                                <circle
                                    cx='18'
                                    cy='6'
                                    r='3'
                                    fill='#10b981'
                                    stroke='white'
                                    strokeWidth='2'
                                    className='animate-bounce'
                                    style={{
                                        animationDuration: '1s',
                                        animationIterationCount: '3',
                                    }}
                                />
                                <path
                                    d='M16.5 6L17.5 7L19.5 5'
                                    stroke='white'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    className='animate-bounce'
                                    style={{
                                        animationDuration: '1s',
                                        animationIterationCount: '3',
                                        animationDelay: '0.1s',
                                    }}
                                />
                            </>
                        )}
                    </svg>
                </button>
                {hasScope && (
                    <div className='ml-2'>
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                            Configured
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScopeCell;
