'use client';

import React, {useState, useRef, useEffect} from 'react';
import {createPortal} from 'react-dom';

interface UserGroupsCountCellProps {
    roleData: any;
    groupCount: number;
    onManageGroups?: (roleData: any) => void;
}

const UserGroupsCountCell: React.FC<UserGroupsCountCellProps> = ({
    roleData,
    groupCount = 0,
    onManageGroups,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({x: 0, y: 0});
    const [mounted, setMounted] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Get the list of groups this role is assigned to
    const assignedGroups = roleData.assignedUserGroups || [];
    const groupNames = assignedGroups.map((group: any) =>
        typeof group === 'string'
            ? group
            : group.name || group.groupName || 'Unknown Group',
    );

    const handleMouseEnter = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setTooltipPosition({
                x: rect.right + 8,
                y: rect.top + rect.height / 2,
            });
            setShowTooltip(true);
        }
    };

    // Inject CSS for slide animation
    const slideInStyles = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translate(-8px, -50%);
        }
        to {
            opacity: 1;
            transform: translate(0, -50%);
        }
    }

    .animate-slideInRight {
        animation: slideInRight 0.15s ease-out forwards;
    }
    `;

    return (
        <>
            <style>{slideInStyles}</style>
            <div className='flex items-center justify-center w-full h-full'>
                <div className='relative'>
                    <button
                        ref={buttonRef}
                        onClick={() =>
                            onManageGroups && onManageGroups(roleData)
                        }
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={() => setShowTooltip(false)}
                        className='relative inline-flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none cursor-pointer'
                        style={{
                            background:
                                groupCount > 0
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                    : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                            boxShadow:
                                groupCount > 0
                                    ? '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
                                    : '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        {/* SVG Icon - User Group */}
                        <svg
                            className='w-6 h-6 transition-all duration-300'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='white'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        >
                            {/* Group of people icon */}
                            <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                            <circle cx='9' cy='7' r='4' />
                            <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
                            <path d='M16 3.13a4 4 0 0 1 0 7.75' />
                        </svg>

                        {/* Badge showing count */}
                        {groupCount > 0 && (
                            <span
                                className='absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shadow-lg border-2 border-white'
                                style={{
                                    minWidth: '24px',
                                    fontSize: '11px',
                                    background:
                                        'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)',
                                }}
                            >
                                {groupCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Tooltip Portal - renders outside table structure */}
            {mounted &&
                showTooltip &&
                groupCount > 0 &&
                createPortal(
                    <div
                        className='fixed pointer-events-none animate-slideInRight'
                        style={{
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y}px`,
                            transform: 'translateY(-50%)',
                            zIndex: 9999,
                        }}
                    >
                        {/* Tooltip arrow pointing left */}
                        <div
                            className='absolute top-1/2'
                            style={{
                                left: '-5px',
                                transform: 'translateY(-50%)',
                            }}
                        >
                            <div
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderTop: '5px solid transparent',
                                    borderBottom: '5px solid transparent',
                                    borderRight: '5px solid #1f2937',
                                }}
                            ></div>
                        </div>

                        <div
                            className='bg-gray-800 text-white rounded-lg shadow-2xl border border-gray-600'
                            style={{
                                minWidth: '320px',
                                maxWidth: '400px',
                                maxHeight: '400px',
                                overflow: 'visible',
                            }}
                        >
                            <>
                                <div className='flex items-center gap-2 px-4 py-3 border-b border-gray-600 bg-gray-700/50'>
                                    <svg
                                        className='w-5 h-5 text-blue-400'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth='2'
                                            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                                        />
                                    </svg>
                                    <span className='font-semibold text-sm text-gray-100'>
                                        Groups ({groupCount})
                                    </span>
                                </div>
                                <div className='p-3 max-h-80 overflow-y-auto'>
                                    {assignedGroups.map(
                                        (group: any, index: number) => (
                                            <div
                                                key={index}
                                                className='flex items-start gap-3 py-2 px-3 mb-2 rounded-md bg-gray-700/40 hover:bg-gray-700/60 transition-all duration-200'
                                            >
                                                <div className='flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5'>
                                                    <svg
                                                        className='w-3.5 h-3.5 text-blue-400'
                                                        fill='currentColor'
                                                        viewBox='0 0 20 20'
                                                    >
                                                        <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
                                                    </svg>
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='text-sm font-medium text-gray-100 break-words'>
                                                        {group.name ||
                                                            group.groupName ||
                                                            'Unknown Group'}
                                                    </div>
                                                    {group.id && (
                                                        <div className='text-xs text-gray-400 mt-0.5 font-mono break-all'>
                                                            #{index + 1}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
};

export default UserGroupsCountCell;
