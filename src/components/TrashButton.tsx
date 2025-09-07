import React from 'react';

interface TrashButtonProps {
    id?: string;
    title?: string;
    onClick?: () => void;
    isHot?: boolean; // highlights when something is being dragged over
    className?: string;
}

export default function TrashButton({
    id,
    title = 'Trash',
    onClick,
    isHot = false,
    className = '',
}: TrashButtonProps) {
    return (
        <button
            id={id}
            onClick={onClick}
            title={title}
            className={`inline-flex items-center justify-center h-9 w-9 rounded-full border transition-all duration-200 ${
                isHot
                    ? 'border-rose-300 text-rose-700 bg-rose-50 shadow-sm scale-[1.03]'
                    : 'border-light text-secondary hover:text-red-600 hover:bg-red-50'
            } ${className}`}
        >
            <svg
                className='w-4 h-4'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
            >
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16'
                />
            </svg>
        </button>
    );
}