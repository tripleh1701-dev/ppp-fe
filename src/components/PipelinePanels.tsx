'use client';

import {useState} from 'react';
import {PipelineVariable, PipelineConfig} from '@/types/workflow';

interface PipelinePanelsProps {
    config: PipelineConfig;
    onConfigChange: (config: PipelineConfig) => void;
}

export default function PipelinePanels({
    config,
    onConfigChange,
}: PipelinePanelsProps) {
    const [ActiveTab, setActiveTab] = useState<
        'variables' | 'notifications' | 'triggers'
    >('variables');
    const [newVariable, setNewVariable] = useState<Partial<PipelineVariable>>({
        name: '',
        value: '',
        type: 'string',
        description: '',
    });

    const addVariable = () => {
        if (newVariable.name && newVariable.value) {
            const updatedConfig = {
                ...config,
                variables: [
                    ...config.variables,
                    newVariable as PipelineVariable,
                ],
            };
            onConfigChange(updatedConfig);
            setNewVariable({
                name: '',
                value: '',
                type: 'string',
                description: '',
            });
        }
    };

    const removeVariable = (index: number) => {
        const updatedConfig = {
            ...config,
            variables: config.variables.filter((_, i) => i !== index),
        };
        onConfigChange(updatedConfig);
    };

    const updateNotifications = (
        type: 'email' | 'slack' | 'teams',
        value: string[],
    ) => {
        const updatedConfig = {
            ...config,
            notifications: {
                ...config.notifications,
                [type]: value,
            },
        };
        onConfigChange(updatedConfig);
    };

    return (
        <div className='w-80 bg-card border-l border-light overflow-y-auto shadow-xl'>
            {/* Panel Header */}
            <div className='p-4 border-b border-light bg-gradient-to-r from-slate-50 to-white'>
                <h3 className='text-sm font-bold text-primary mb-3'>
                    Pipeline Configuration
                </h3>

                {/* Tab Navigation */}
                <div className='flex space-x-1 bg-tertiary rounded-xl p-1'>
                    <button
                        onClick={() => setActiveTab('variables')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                            ActiveTab === 'variables'
                                ? 'bg-card text-brand shadow-md'
                                : 'text-secondary hover:text-primary'
                        }`}
                    >
                        Variables
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                            ActiveTab === 'notifications'
                                ? 'bg-card text-brand shadow-md'
                                : 'text-secondary hover:text-primary'
                        }`}
                    >
                        Notify
                    </button>
                    <button
                        onClick={() => setActiveTab('triggers')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                            ActiveTab === 'triggers'
                                ? 'bg-card text-brand shadow-md'
                                : 'text-secondary hover:text-primary'
                        }`}
                    >
                        Triggers
                    </button>
                </div>
            </div>

            {/* Panel Content */}
            <div className='p-4'>
                {/* Variables Tab */}
                {ActiveTab === 'variables' && (
                    <div className='space-y-4'>
                        <div>
                            <h4 className='text-sm font-semibold text-primary mb-3'>
                                Pipeline Variables
                            </h4>

                            {/* Add Variable Form */}
                            <div className='space-y-3 p-4 border border-light rounded-xl bg-tertiary/30'>
                                <input
                                    type='text'
                                    placeholder='Variable name'
                                    value={newVariable.name}
                                    onChange={(e) =>
                                        setNewVariable({
                                            ...newVariable,
                                            name: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 text-sm border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card'
                                />
                                <input
                                    type='text'
                                    placeholder='Variable value'
                                    value={newVariable.value}
                                    onChange={(e) =>
                                        setNewVariable({
                                            ...newVariable,
                                            value: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 text-sm border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card'
                                />
                                <select
                                    value={newVariable.type}
                                    onChange={(e) =>
                                        setNewVariable({
                                            ...newVariable,
                                            type: e.target.value as
                                                | 'string'
                                                | 'number'
                                                | 'boolean'
                                                | 'secret',
                                        })
                                    }
                                    className='w-full px-3 py-2 text-sm border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card'
                                >
                                    <option value='string'>String</option>
                                    <option value='number'>Number</option>
                                    <option value='boolean'>Boolean</option>
                                    <option value='secret'>Secret</option>
                                </select>
                                <button
                                    onClick={addVariable}
                                    className='w-full px-3 py-2.5 text-sm font-medium text-inverse bg-primary rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md'
                                >
                                    Add Variable
                                </button>
                            </div>

                            {/* Variables List */}
                            <div className='mt-4 space-y-2'>
                                {config.variables.map((variable, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center justify-between p-3 border border-light rounded-xl bg-card hover:bg-tertiary/20 transition-colors duration-200'
                                    >
                                        <div className='flex-1'>
                                            <div className='flex items-center space-x-2'>
                                                <span className='text-sm font-semibold text-primary'>
                                                    {variable.name}
                                                </span>
                                                <span
                                                    className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${
                                                        variable.type ===
                                                        'secret'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-tertiary text-secondary'
                                                    }`}
                                                >
                                                    {variable.type}
                                                </span>
                                            </div>
                                            <div className='text-xs text-secondary mt-1'>
                                                {variable.type === 'secret'
                                                    ? '••••••••'
                                                    : variable.value}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                removeVariable(index)
                                            }
                                            className='text-red-500 hover:text-red-600 ml-2 p-1 rounded-lg hover:bg-red-50 transition-all duration-200'
                                        >
                                            <svg
                                                className='w-4 h-4'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {ActiveTab === 'notifications' && (
                    <div className='space-y-4'>
                        <div>
                            <h4 className='text-sm font-medium text-gray-900 mb-3'>
                                Notification Settings
                            </h4>

                            {/* Email Notifications */}
                            <div className='space-y-3'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Email Recipients
                                    </label>
                                    <textarea
                                        placeholder='Enter email addresses (one per line)'
                                        value={config.notifications.email.join(
                                            '\n',
                                        )}
                                        onChange={(e) =>
                                            updateNotifications(
                                                'email',
                                                e.target.value
                                                    .split('\n')
                                                    .filter((email) =>
                                                        email.trim(),
                                                    ),
                                            )
                                        }
                                        className='w-full px-3 py-2 text-sm border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card'
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Slack Channels
                                    </label>
                                    <textarea
                                        placeholder='Enter Slack channels (one per line)'
                                        value={config.notifications.slack.join(
                                            '\n',
                                        )}
                                        onChange={(e) =>
                                            updateNotifications(
                                                'slack',
                                                e.target.value
                                                    .split('\n')
                                                    .filter((channel) =>
                                                        channel.trim(),
                                                    ),
                                            )
                                        }
                                        className='w-full px-3 py-2 text-sm border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card'
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Microsoft Teams
                                    </label>
                                    <textarea
                                        placeholder='Enter Teams webhook URLs (one per line)'
                                        value={config.notifications.teams.join(
                                            '\n',
                                        )}
                                        onChange={(e) =>
                                            updateNotifications(
                                                'teams',
                                                e.target.value
                                                    .split('\n')
                                                    .filter((url) =>
                                                        url.trim(),
                                                    ),
                                            )
                                        }
                                        className='w-full px-3 py-2 text-sm border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card'
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Triggers Tab */}
                {ActiveTab === 'triggers' && (
                    <div className='space-y-4'>
                        <div>
                            <h4 className='text-sm font-medium text-gray-900 mb-3'>
                                Pipeline Triggers
                            </h4>

                            <div className='space-y-3'>
                                <label className='flex items-center space-x-3'>
                                    <input
                                        type='checkbox'
                                        checked={config.triggers.push}
                                        onChange={(e) =>
                                            onConfigChange({
                                                ...config,
                                                triggers: {
                                                    ...config.triggers,
                                                    push: e.target.checked,
                                                },
                                            })
                                        }
                                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                    />
                                    <span className='text-sm text-gray-700'>
                                        Push to main branch
                                    </span>
                                </label>

                                <label className='flex items-center space-x-3'>
                                    <input
                                        type='checkbox'
                                        checked={config.triggers.pullRequest}
                                        onChange={(e) =>
                                            onConfigChange({
                                                ...config,
                                                triggers: {
                                                    ...config.triggers,
                                                    pullRequest:
                                                        e.target.checked,
                                                },
                                            })
                                        }
                                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                    />
                                    <span className='text-sm text-gray-700'>
                                        Pull Request
                                    </span>
                                </label>

                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Schedule (Cron)
                                    </label>
                                    <input
                                        type='text'
                                        placeholder='0 0 * * 1 (Every Monday at midnight)'
                                        value={config.triggers.schedule || ''}
                                        onChange={(e) =>
                                            onConfigChange({
                                                ...config,
                                                triggers: {
                                                    ...config.triggers,
                                                    schedule: e.target.value,
                                                },
                                            })
                                        }
                                        className='w-full px-3 py-2 text-sm border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card'
                                    />
                                    <p className='mt-1 text-xs text-gray-500'>
                                        Use cron syntax for scheduled triggers
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
