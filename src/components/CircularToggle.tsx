'use client';

import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

export interface CircularToggleConfig {
    success: {
        message: string;
        enabled: boolean;
        notifications: {
            email: boolean;
            slack: boolean;
        };
    };
    warning: {
        message: string;
        enabled: boolean;
        notifications: {
            email: boolean;
            slack: boolean;
        };
    };
    failure: {
        message: string;
        enabled: boolean;
        notifications: {
            email: boolean;
            slack: boolean;
        };
        actions: {
            rollback: boolean;
            retrigger: boolean;
            notify: boolean;
        };
    };
}

interface CircularToggleProps {
    isOpen: boolean;
    onToggle: () => void;
    config: CircularToggleConfig;
    onConfigChange: (config: CircularToggleConfig) => void;
    onSave: (config: CircularToggleConfig) => void;
    position?: {x: number; y: number};
}

// Reusable notification toggle component
const NotificationToggle: React.FC<{
    label: string;
    icon: string;
    isEnabled: boolean;
    onToggle: () => void;
    color: string;
}> = ({label, icon, isEnabled, onToggle, color}) => (
    <div className='flex items-center justify-between'>
        <div className='flex items-center'>
            <span className='text-sm mr-2'>{icon}</span>
            <span className='text-xs text-gray-700'>{label}</span>
        </div>
        <div
            className={`w-8 h-4 rounded-full cursor-pointer transition-all duration-200 ${
                isEnabled ? color : 'bg-gray-300'
            }`}
            onClick={onToggle}
        >
            <div
                className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                } mt-0.5`}
            ></div>
        </div>
    </div>
);

const CircularToggle: React.FC<CircularToggleProps> = ({
    isOpen,
    onToggle,
    config,
    onConfigChange,
    onSave,
    position = {x: 0, y: 0},
}) => {
    const [ActiveSegment, setActiveSegment] = useState<
        'success' | 'warning' | 'failure' | null
    >(null);
    const [localConfig, setLocalConfig] =
        useState<CircularToggleConfig>(config);

    // Auto-save functionality
    useEffect(() => {
        const timer = setTimeout(() => {
            onSave(localConfig);
        }, 1000); // Auto-save after 1 second of inactivity

        return () => clearTimeout(timer);
    }, [localConfig, onSave]);

    const updateConfig = (updates: Partial<CircularToggleConfig>) => {
        const newConfig = {...localConfig, ...updates};
        setLocalConfig(newConfig);
        onConfigChange(newConfig);
    };

    const handleSave = () => {
        onSave(localConfig);
        setActiveSegment(null);
    };

    return (
        <div className='relative' style={{left: position.x, top: position.y}}>
            {/* Toggle Switch with Sliding Arrow - Positioned at Arc Opening */}
            <motion.button
                style={{
                    position: 'absolute',
                    left: '70%', // Position at the right opening after 90° rotation
                    top: '50%', // Center vertically
                    transform: 'translate(-50%, -50%)',
                    zIndex: 20,
                }}
                onClick={onToggle}
                className={`relative transition-all duration-300 ${
                    isOpen ? 'opacity-90' : 'hover:shadow-md'
                }`}
                whileHover={{
                    scale: 1.05,
                    transition: {duration: 0.2, ease: 'easeOut'},
                }}
                whileTap={{
                    scale: 0.95,
                    transition: {duration: 0.1},
                }}
            >
                {/* Toggle Switch Track - Much Smaller Size */}
                <div
                    className={`rounded-full border transition-all duration-200 ${
                        isOpen
                            ? 'bg-green-500 border-green-600'
                            : 'bg-gray-300 border-gray-400'
                    }`}
                    style={{
                        width: '24px',
                        height: '12px',
                        position: 'relative',
                    }}
                >
                    {/* Sliding Toggle with Arrow Symbol - Fast Animation */}
                    <motion.div
                        className={`absolute bg-white rounded-full shadow-sm flex items-center justify-center ${
                            isOpen ? 'shadow-md' : ''
                        }`}
                        style={{
                            width: '10px',
                            height: '10px',
                            top: '1px',
                        }}
                        animate={{
                            left: isOpen ? '13px' : '1px',
                        }}
                        transition={{
                            duration: 0.15,
                            type: 'tween',
                            ease: 'easeInOut',
                        }}
                    >
                        {/* Arrow Symbol --> */}
                        <div className='flex items-center text-gray-600 text-[6px] font-bold'>
                            →
                        </div>
                    </motion.div>
                </div>
            </motion.button>

            {/* Expanded Semi-Circle Segments */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{scale: 0, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        exit={{scale: 0, opacity: 0}}
                        transition={{
                            duration: 0.4,
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                        }}
                        className='absolute -top-2 left-2'
                    >
                        <div className='relative w-8 h-8'>
                            {/* Semicircular arc with 3 colored segments */}
                            <svg
                                width='80'
                                height='50'
                                viewBox='0 0 80 50'
                                className='absolute'
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    transform:
                                        'translate(-50%, -50%) rotate(90deg)',
                                }}
                            >
                                {/* Green segment */}
                                <path
                                    d='M 8 40 A 32 32 0 0 1 22 12 L 28 18 A 22 22 0 0 0 15 36 Z'
                                    fill='#10B981'
                                    stroke='#059669'
                                    strokeWidth='2'
                                    className='cursor-pointer hover:opacity-80 transition-opacity duration-200'
                                    onClick={() => setActiveSegment('success')}
                                />

                                {/* Red segment */}
                                <path
                                    d='M 28 12 A 32 32 0 0 1 52 12 L 47 18 A 22 22 0 0 0 33 18 Z'
                                    fill='#EF4444'
                                    stroke='#DC2626'
                                    strokeWidth='2'
                                    className='cursor-pointer hover:opacity-80 transition-opacity duration-200'
                                    onClick={() => setActiveSegment('failure')}
                                />

                                {/* Orange segment */}
                                <path
                                    d='M 58 12 A 32 32 0 0 1 72 40 L 65 36 A 22 22 0 0 0 52 18 Z'
                                    fill='#F59E0B'
                                    stroke='#D97706'
                                    strokeWidth='2'
                                    className='cursor-pointer hover:opacity-80 transition-opacity duration-200'
                                    onClick={() => setActiveSegment('warning')}
                                />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Configuration Panel */}
            <AnimatePresence>
                {ActiveSegment && (
                    <motion.div
                        initial={{opacity: 0, x: -40, scale: 0.9}}
                        animate={{opacity: 1, x: 0, scale: 1}}
                        exit={{opacity: 0, x: -40, scale: 0.9}}
                        transition={{
                            duration: 0.3,
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                        }}
                        className='absolute top-0 left-24 rounded-lg shadow-xl border border-blue-100 p-3 min-w-[220px] max-w-[280px] z-50'
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%)',
                            backdropFilter: 'blur(12px)',
                            boxShadow:
                                '0 8px 32px rgba(59, 130, 246, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
                            border: '1px solid rgba(59, 130, 246, 0.15)',
                        }}
                    >
                        {/* Pointer Arrow */}
                        <motion.div
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{opacity: 1, scale: 1}}
                            transition={{delay: 0.1, duration: 0.2}}
                            className='absolute top-1/2 -left-2 w-4 h-4 border-r border-b border-blue-100 transform rotate-45 -translate-y-1/2'
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%)',
                            }}
                        ></motion.div>
                        <div className='flex items-center justify-between mb-2'>
                            <h3 className='text-xs font-medium text-gray-800 capitalize flex items-center gap-1'>
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        ActiveSegment === 'success'
                                            ? 'bg-green-500'
                                            : ActiveSegment === 'warning'
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                    }`}
                                ></span>
                                {ActiveSegment} Config
                            </h3>
                            <motion.button
                                onClick={() => setActiveSegment(null)}
                                className='w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full text-sm transition-all duration-200'
                                whileHover={{
                                    scale: 1.1,
                                    rotate: 90,
                                    transition: {duration: 0.2},
                                }}
                                whileTap={{scale: 0.9}}
                            >
                                ×
                            </motion.button>
                        </div>

                        {/* Success Configuration */}
                        {ActiveSegment === 'success' && (
                            <div className='space-y-3'>
                                <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                                        Success Message
                                    </label>
                                    <textarea
                                        value={localConfig.success.message}
                                        onChange={(e) =>
                                            updateConfig({
                                                success: {
                                                    ...localConfig.success,
                                                    message: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder='Enter success notification message...'
                                        className='w-full p-2 border border-gray-300 rounded text-xs resize-none h-12 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white'
                                    />
                                </div>

                                {/* Notification Channels */}
                                <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-2'>
                                        📢 Notification Channels
                                    </label>
                                    <div className='space-y-2'>
                                        <NotificationToggle
                                            label='Email'
                                            icon='📧'
                                            isEnabled={
                                                localConfig.success
                                                    .notifications?.email ||
                                                false
                                            }
                                            onToggle={() =>
                                                updateConfig({
                                                    success: {
                                                        ...localConfig.success,
                                                        notifications: {
                                                            ...localConfig
                                                                .success
                                                                .notifications,
                                                            email: !localConfig
                                                                .success
                                                                .notifications
                                                                ?.email,
                                                        },
                                                    },
                                                })
                                            }
                                            color='bg-green-500'
                                        />
                                        <NotificationToggle
                                            label='Slack'
                                            icon='💬'
                                            isEnabled={
                                                localConfig.success
                                                    .notifications?.slack ||
                                                false
                                            }
                                            onToggle={() =>
                                                updateConfig({
                                                    success: {
                                                        ...localConfig.success,
                                                        notifications: {
                                                            ...localConfig
                                                                .success
                                                                .notifications,
                                                            slack: !localConfig
                                                                .success
                                                                .notifications
                                                                ?.slack,
                                                        },
                                                    },
                                                })
                                            }
                                            color='bg-green-500'
                                        />
                                    </div>
                                </div>

                                <div className='flex items-center'>
                                    <input
                                        type='checkbox'
                                        id='success-enabled'
                                        checked={localConfig.success.enabled}
                                        onChange={(e) =>
                                            updateConfig({
                                                success: {
                                                    ...localConfig.success,
                                                    enabled: e.target.checked,
                                                },
                                            })
                                        }
                                        className='h-3.5 w-3.5 text-green-600 focus:ring-green-500 border-gray-300 rounded'
                                    />
                                    <label
                                        htmlFor='success-enabled'
                                        className='ml-2 text-xs text-gray-700'
                                    >
                                        Enable success notifications
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Warning Configuration */}
                        {ActiveSegment === 'warning' && (
                            <div className='space-y-3'>
                                <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                                        Warning Message
                                    </label>
                                    <textarea
                                        value={localConfig.warning.message}
                                        onChange={(e) =>
                                            updateConfig({
                                                warning: {
                                                    ...localConfig.warning,
                                                    message: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder='Enter warning notification message...'
                                        className='w-full p-2 border border-gray-300 rounded text-xs resize-none h-12 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-gray-50 focus:bg-white'
                                    />
                                </div>

                                {/* Notification Channels */}
                                <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-2'>
                                        Notification Channels
                                    </label>
                                    <div className='space-y-2'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center'>
                                                <svg
                                                    className='w-3.5 h-3.5 mr-2 text-gray-600'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M16 12l-4 4-4-4m8-4l-4 4-4-4'
                                                    />
                                                </svg>
                                                <span className='text-xs text-gray-700'>
                                                    Email
                                                </span>
                                            </div>
                                            <div
                                                className={`w-8 h-4 rounded-full cursor-pointer transition-all duration-200 ${
                                                    localConfig.warning
                                                        .notifications?.email
                                                        ? 'bg-yellow-500'
                                                        : 'bg-gray-300'
                                                }`}
                                                onClick={() =>
                                                    updateConfig({
                                                        warning: {
                                                            ...localConfig.warning,
                                                            notifications: {
                                                                ...localConfig
                                                                    .warning
                                                                    .notifications,
                                                                email: !localConfig
                                                                    .warning
                                                                    .notifications
                                                                    ?.email,
                                                            },
                                                        },
                                                    })
                                                }
                                            >
                                                <div
                                                    className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                        localConfig.warning
                                                            .notifications
                                                            ?.email
                                                            ? 'translate-x-4'
                                                            : 'translate-x-0.5'
                                                    } mt-0.5`}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center'>
                                                <svg
                                                    className='w-3.5 h-3.5 mr-2 text-gray-600'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M8 10h8m-8 4h5m-9 5l3-3h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14z'
                                                    />
                                                </svg>
                                                <span className='text-xs text-gray-700'>
                                                    Slack
                                                </span>
                                            </div>
                                            <div
                                                className={`w-8 h-4 rounded-full cursor-pointer transition-all duration-200 ${
                                                    localConfig.warning
                                                        .notifications?.slack
                                                        ? 'bg-yellow-500'
                                                        : 'bg-gray-300'
                                                }`}
                                                onClick={() =>
                                                    updateConfig({
                                                        warning: {
                                                            ...localConfig.warning,
                                                            notifications: {
                                                                ...localConfig
                                                                    .warning
                                                                    .notifications,
                                                                slack: !localConfig
                                                                    .warning
                                                                    .notifications
                                                                    ?.slack,
                                                            },
                                                        },
                                                    })
                                                }
                                            >
                                                <div
                                                    className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                        localConfig.warning
                                                            .notifications
                                                            ?.slack
                                                            ? 'translate-x-4'
                                                            : 'translate-x-0.5'
                                                    } mt-0.5`}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='flex items-center'>
                                    <input
                                        type='checkbox'
                                        id='warning-enabled'
                                        checked={localConfig.warning.enabled}
                                        onChange={(e) =>
                                            updateConfig({
                                                warning: {
                                                    ...localConfig.warning,
                                                    enabled: e.target.checked,
                                                },
                                            })
                                        }
                                        className='h-3.5 w-3.5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                                    />
                                    <label
                                        htmlFor='warning-enabled'
                                        className='ml-2 text-xs text-gray-700'
                                    >
                                        Enable warning notifications
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Failure Configuration */}
                        {ActiveSegment === 'failure' && (
                            <div className='space-y-3'>
                                <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                                        Failure Message
                                    </label>
                                    <textarea
                                        value={localConfig.failure.message}
                                        onChange={(e) =>
                                            updateConfig({
                                                failure: {
                                                    ...localConfig.failure,
                                                    message: e.target.value,
                                                },
                                            })
                                        }
                                        placeholder='Enter failure notification message...'
                                        className='w-full p-2 border border-gray-300 rounded text-xs resize-none h-12 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white'
                                    />
                                </div>
                                {/* Notification Channels */}
                                <div>
                                    <label className='block text-xs font-medium text-gray-700 mb-2'>
                                        Notification Channels
                                    </label>
                                    <div className='space-y-2'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center'>
                                                <svg
                                                    className='w-3.5 h-3.5 mr-2 text-gray-600'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M16 12l-4 4-4-4m8-4l-4 4-4-4'
                                                    />
                                                </svg>
                                                <span className='text-xs text-gray-700'>
                                                    Email
                                                </span>
                                            </div>
                                            <div
                                                className={`w-8 h-4 rounded-full cursor-pointer transition-all duration-200 ${
                                                    localConfig.failure
                                                        .notifications?.email
                                                        ? 'bg-red-500'
                                                        : 'bg-gray-300'
                                                }`}
                                                onClick={() =>
                                                    updateConfig({
                                                        failure: {
                                                            ...localConfig.failure,
                                                            notifications: {
                                                                ...localConfig
                                                                    .failure
                                                                    .notifications,
                                                                email: !localConfig
                                                                    .failure
                                                                    .notifications
                                                                    ?.email,
                                                            },
                                                        },
                                                    })
                                                }
                                            >
                                                <div
                                                    className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                        localConfig.failure
                                                            .notifications
                                                            ?.email
                                                            ? 'translate-x-4'
                                                            : 'translate-x-0.5'
                                                    } mt-0.5`}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center'>
                                                <svg
                                                    className='w-3.5 h-3.5 mr-2 text-gray-600'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M8 10h8m-8 4h5m-9 5l3-3h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14z'
                                                    />
                                                </svg>
                                                <span className='text-xs text-gray-700'>
                                                    Slack
                                                </span>
                                            </div>
                                            <div
                                                className={`w-8 h-4 rounded-full cursor-pointer transition-all duration-200 ${
                                                    localConfig.failure
                                                        .notifications?.slack
                                                        ? 'bg-red-500'
                                                        : 'bg-gray-300'
                                                }`}
                                                onClick={() =>
                                                    updateConfig({
                                                        failure: {
                                                            ...localConfig.failure,
                                                            notifications: {
                                                                ...localConfig
                                                                    .failure
                                                                    .notifications,
                                                                slack: !localConfig
                                                                    .failure
                                                                    .notifications
                                                                    ?.slack,
                                                            },
                                                        },
                                                    })
                                                }
                                            >
                                                <div
                                                    className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                        localConfig.failure
                                                            .notifications
                                                            ?.slack
                                                            ? 'translate-x-4'
                                                            : 'translate-x-0.5'
                                                    } mt-0.5`}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <label className='block text-xs font-medium text-gray-700'>
                                        Actions
                                    </label>
                                    <div className='space-y-1.5'>
                                        <div className='flex items-center'>
                                            <input
                                                type='checkbox'
                                                id='failure-rollback'
                                                checked={
                                                    localConfig.failure.actions
                                                        .rollback
                                                }
                                                onChange={(e) =>
                                                    updateConfig({
                                                        failure: {
                                                            ...localConfig.failure,
                                                            actions: {
                                                                ...localConfig
                                                                    .failure
                                                                    .actions,
                                                                rollback:
                                                                    e.target
                                                                        .checked,
                                                            },
                                                        },
                                                    })
                                                }
                                                className='h-3.5 w-3.5 text-red-600 focus:ring-red-500 border-gray-300 rounded'
                                            />
                                            <label
                                                htmlFor='failure-rollback'
                                                className='ml-2 text-xs text-gray-700'
                                            >
                                                Auto-rollback
                                            </label>
                                        </div>
                                        <div className='flex items-center'>
                                            <input
                                                type='checkbox'
                                                id='failure-retrigger'
                                                checked={
                                                    localConfig.failure.actions
                                                        .retrigger
                                                }
                                                onChange={(e) =>
                                                    updateConfig({
                                                        failure: {
                                                            ...localConfig.failure,
                                                            actions: {
                                                                ...localConfig
                                                                    .failure
                                                                    .actions,
                                                                retrigger:
                                                                    e.target
                                                                        .checked,
                                                            },
                                                        },
                                                    })
                                                }
                                                className='h-3.5 w-3.5 text-red-600 focus:ring-red-500 border-gray-300 rounded'
                                            />
                                            <label
                                                htmlFor='failure-retrigger'
                                                className='ml-2 text-xs text-gray-700'
                                            >
                                                Auto-retrigger
                                            </label>
                                        </div>
                                        <div className='flex items-center'>
                                            <input
                                                type='checkbox'
                                                id='failure-notify'
                                                checked={
                                                    localConfig.failure.actions
                                                        .notify
                                                }
                                                onChange={(e) =>
                                                    updateConfig({
                                                        failure: {
                                                            ...localConfig.failure,
                                                            actions: {
                                                                ...localConfig
                                                                    .failure
                                                                    .actions,
                                                                notify: e.target
                                                                    .checked,
                                                            },
                                                        },
                                                    })
                                                }
                                                className='h-3.5 w-3.5 text-red-600 focus:ring-red-500 border-gray-300 rounded'
                                            />
                                            <label
                                                htmlFor='failure-notify'
                                                className='ml-2 text-xs text-gray-700'
                                            >
                                                Send notifications
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className='flex items-center'>
                                    <input
                                        type='checkbox'
                                        id='failure-enabled'
                                        checked={localConfig.failure.enabled}
                                        onChange={(e) =>
                                            updateConfig({
                                                failure: {
                                                    ...localConfig.failure,
                                                    enabled: e.target.checked,
                                                },
                                            })
                                        }
                                        className='h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded'
                                    />
                                    <label
                                        htmlFor='failure-enabled'
                                        className='ml-2 text-sm text-gray-700'
                                    >
                                        Enable handling
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className='mt-3 pt-2 border-t border-gray-100'>
                            <motion.button
                                onClick={handleSave}
                                className='w-full px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md'
                                whileHover={{
                                    scale: 1.02,
                                    y: -1,
                                    transition: {duration: 0.2},
                                }}
                                whileTap={{
                                    scale: 0.98,
                                    y: 0,
                                    transition: {duration: 0.1},
                                }}
                            >
                                Save Config
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CircularToggle;
