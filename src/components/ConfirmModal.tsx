'use client';

import React from 'react';

interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    open,
    title = 'Confirm delete',
    message,
    confirmText = 'Yes, delete',
    cancelText = 'Cancel',
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
                        className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className='px-4 py-2 text-sm font-medium text-inverse bg-red-600 hover:bg-red-700 rounded-lg'
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}


