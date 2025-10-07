'use client';

import React from 'react';

interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    loadingText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    open,
    title = 'Confirm delete',
    message,
    confirmText = 'Yes, delete',
    cancelText = 'Cancel',
    loading = false,
    loadingText = 'Deleting...',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!open) return null;
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4'>
            <div className='bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden'>
                <div className='px-6 py-4 border-b border-light'>
                    <h3 className='text-lg font-bold text-primary'>{title}</h3>
                </div>
                <div className='p-6'>
                    <p className='text-sm text-primary whitespace-pre-line'>{message}</p>
                </div>
                <div className='px-6 py-4 border-t border-light flex justify-end gap-2'>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className='px-4 py-2 text-sm font-medium text-inverse bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg inline-flex items-center'
                    >
                        {loading && (
                            <svg
                                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                                fill='none'
                                viewBox='0 0 24 24'
                            >
                                <circle
                                    className='opacity-25'
                                    cx='12'
                                    cy='12'
                                    r='10'
                                    stroke='currentColor'
                                    strokeWidth='4'
                                ></circle>
                                <path
                                    className='opacity-75'
                                    fill='currentColor'
                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                ></path>
                            </svg>
                        )}
                        {loading ? loadingText : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}


