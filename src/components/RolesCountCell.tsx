'use client';

import React, {useState} from 'react';

// Add slide-in animation styles
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
    const [showTooltip, setShowTooltip] = useState(false);
    const hasRoles = roleCount > 0;

    // Get the roles array from groupData
    const roles = groupData?.roles || [];
    const roleNames = Array.isArray(roles) ? roles : [];

    return (
        <>
            {/* Inject animation styles */}
            <style>{slideInStyles}</style>

            <div className='flex items-center justify-center w-full h-full'>
                <div className='relative'>
                    <button
                        onClick={() => onManageRoles(groupData)}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className={`group relative p-2.5 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                            hasRoles
                                ? 'bg-blue-50 hover:bg-blue-100'
                                : 'bg-gray-50 hover:bg-blue-50'
                        }`}
                        aria-label={
                            hasRoles
                                ? `${roleCount} role(s) assigned`
                                : 'No roles assigned'
                        }
                    >
                        {/* Blue-themed Role Badge SVG Icon */}
                        <div className='relative flex items-center justify-center'>
                            <svg
                                width='24'
                                height='24'
                                viewBox='0 0 24 24'
                                fill='none'
                                className='transition-all duration-300'
                                style={{
                                    color: hasRoles ? '#3b82f6' : '#9ca3af',
                                }}
                            >
                                {/* Shield background */}
                                <path
                                    d='M12 2L4 6V12C4 16.5 7 20.5 12 22C17 20.5 20 16.5 20 12V6L12 2Z'
                                    fill='currentColor'
                                    fillOpacity='0.15'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                {/* Badge/Star icon in center */}
                                <path
                                    d='M12 8L13.5 11H17L14.5 13L15.5 16L12 14L8.5 16L9.5 13L7 11H10.5L12 8Z'
                                    fill='currentColor'
                                    stroke='currentColor'
                                    strokeWidth='1'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>

                            {/* Role count badge */}
                            {hasRoles && (
                                <div className='absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm'>
                                    {roleCount}
                                </div>
                            )}
                        </div>

                        {/* Hover glow effect */}
                        <div className='absolute inset-0 rounded-lg bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10'></div>
                    </button>

                    {/* Tooltip with roles list */}
                    {showTooltip && (
                        <div
                            className='absolute left-full top-1/2 pointer-events-none animate-slideInRight'
                            style={{
                                marginLeft: '8px',
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
                                className='bg-gray-800 text-white text-xs rounded-md shadow-2xl py-2 px-3 border border-gray-700'
                                style={{
                                    minWidth: '180px',
                                    maxWidth: '220px',
                                    maxHeight: '300px',
                                    overflow: 'auto',
                                }}
                            >
                                {/* Compact header */}
                                <div className='font-semibold text-blue-300 mb-1.5 flex items-center gap-1.5 text-xs'>
                                    <svg
                                        width='14'
                                        height='14'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        className='flex-shrink-0'
                                    >
                                        <path
                                            d='M12 2L4 6V12C4 16.5 7 20.5 12 22C17 20.5 20 16.5 20 12V6L12 2Z'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            fill='none'
                                        />
                                    </svg>
                                    <span>
                                        {hasRoles
                                            ? `Roles (${roleCount})`
                                            : 'No Roles'}
                                    </span>
                                </div>

                                {hasRoles ? (
                                    <ul className='space-y-1'>
                                        {roleNames.map(
                                            (role: string, index: number) => (
                                                <li
                                                    key={index}
                                                    className='flex items-center gap-2 text-gray-100 py-1 px-2 rounded bg-gray-700 text-xs'
                                                >
                                                    <span className='text-blue-400 text-sm'>
                                                        •
                                                    </span>
                                                    <span className='flex-1 truncate'>
                                                        {role || 'Unnamed'}
                                                    </span>
                                                    <span className='text-gray-400 text-xs'>
                                                        #{index + 1}
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                ) : (
                                    <p className='text-gray-400 text-xs italic'>
                                        Click to assign
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default RolesCountCell;
