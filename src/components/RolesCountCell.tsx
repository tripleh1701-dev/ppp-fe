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
                        ? 'Roles assigned - Click to manage'
                        : 'No roles assigned - Click to assign'
                }
            >
                {/* Role Shield SVG Icon */}
                <div className='relative'>
                    <svg
                        width='22'
                        height='22'
                        viewBox='0 0 24 24'
                        fill='none'
                        style={{
                            color: hasRoles ? '#10b981' : '#9ca3af',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {/* Modern shield/security icon for roles */}
                        <path
                            d='M12 2L3 7L12 22L21 7L12 2Z'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            fill='none'
                        />
                        <path
                            d='M12 7V17'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                        />
                        <circle
                            cx='12'
                            cy='10'
                            r='2'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            fill='none'
                        />
                    </svg>
                </div>

                {/* Simple Hover Effect */}
                <div className='absolute inset-0 rounded-lg bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
            </button>
        </div>
    );
};

export default RolesCountCell;
