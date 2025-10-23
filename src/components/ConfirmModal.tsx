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
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4'>
            <div className='bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200'>
                <div className='px-6 py-4 border-b border-gray-200'>
                    <div className='flex items-center gap-3'>
                        {title === 'Information' && (
                            <div className='flex-shrink-0'>
                                <svg className='w-6 h-6 text-red-500' fill='currentColor' viewBox='0 0 24 24'>
                                    <path fillRule='evenodd' d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z' clipRule='evenodd' />
                                </svg>
                            </div>
                        )}
                        <h3 className='text-lg font-bold text-gray-900'>{title}</h3>
                    </div>
                </div>
                <div className='p-6'>
                    <div className='flex items-start gap-3'>
                        {title !== 'Information' && (
                            <div className='flex-shrink-0 mt-0.5'>
                                <svg className='w-5 h-5 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                </svg>
                            </div>
                        )}
                        <p className='text-sm text-gray-700 whitespace-pre-line leading-relaxed flex-1'>{message}</p>
                    </div>
                </div>
                <div className='px-6 py-4 border-t border-gray-200 flex justify-end gap-3'>
                    {cancelText && (
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors'
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className='px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg inline-flex items-center transition-colors'
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


