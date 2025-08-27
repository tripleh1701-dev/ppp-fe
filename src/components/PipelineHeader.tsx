'use client';

import {useState, useEffect} from 'react';
import ArcToggleComponent from './ArcToggleComponent';
import {AUTO_SAVE_CONFIG} from '@/constants/pipeline';
import {api} from '@/utils/api';

interface PipelineHeaderProps {
    pipelineName: string;
    setPipelineName: (name: string) => void;
    deploymentType: string;
    setDeploymentType: (type: string) => void;
    description: string;
    setDescription: (desc: string) => void;
    pipelineState: boolean;
    setPipelineState: (state: boolean) => void;
    showSaveDropdown: boolean;
    setShowSaveDropdown: (show: boolean) => void;
    onFormatCanvas: () => void;
    onSave: (saveAs?: boolean) => void;
    onCopyFromTemplate?: (templateId: string) => void;
}

export default function PipelineHeader({
    pipelineName,
    setPipelineName,
    deploymentType,
    setDeploymentType,
    description,
    setDescription,
    pipelineState,
    setPipelineState,
    showSaveDropdown,
    setShowSaveDropdown,
    onFormatCanvas,
    onSave,
    onCopyFromTemplate,
}: PipelineHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

    // Load available templates
    useEffect(() => {
        const loadTemplates = () => {
            try {
                (async () => {
                    const templates = await api.get<any[]>('/api/templates');
                    if (templates) setAvailableTemplates(templates);
                })();
            } catch (error) {
                console.error('Error loading templates:', error);
            }
        };

        loadTemplates();
    }, []);

    return (
        <div className='bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 flex items-center justify-between shadow-sm'>
            {/* Left Side - Pipeline Info */}
            <div className='flex items-center space-x-6'>
                <div className='bg-gray-50 border border-gray-300 rounded-lg p-3 min-w-[280px]'>
                    <div className='space-y-1.5'>
                        <div className='flex items-center space-x-2'>
                            <span className='text-sm font-medium text-gray-700'>
                                Pipeline Name:
                            </span>
                            {isEditing ? (
                                <input
                                    type='text'
                                    value={pipelineName}
                                    onChange={(e) =>
                                        setPipelineName(e.target.value)
                                    }
                                    onBlur={() => setIsEditing(false)}
                                    onKeyPress={(e) =>
                                        e.key === 'Enter' && setIsEditing(false)
                                    }
                                    className='text-sm font-semibold bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500'
                                    autoFocus
                                />
                            ) : (
                                <span
                                    className='text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600'
                                    onClick={() => setIsEditing(true)}
                                >
                                    {pipelineName}
                                </span>
                            )}
                        </div>

                        <div className='flex items-center space-x-2'>
                            <span className='text-sm font-medium text-gray-700'>
                                Deployment Type:
                            </span>
                            <select
                                value={deploymentType}
                                onChange={(e) =>
                                    setDeploymentType(e.target.value)
                                }
                                className='text-sm font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500'
                            >
                                <option value='Integrations'>
                                    Integrations
                                </option>
                                <option value='Applications'>
                                    Applications
                                </option>
                                <option value='Infrastructure'>
                                    Infrastructure
                                </option>
                                <option value='Microservices'>
                                    Microservices
                                </option>
                            </select>
                        </div>

                        {description && (
                            <div className='flex items-center space-x-2'>
                                <span className='text-sm font-medium text-gray-700'>
                                    Description:
                                </span>
                                <input
                                    type='text'
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder='Enter description...'
                                    className='text-sm text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 flex-1'
                                />
                            </div>
                        )}

                        <div className='flex items-center space-x-4'>
                            <span className='text-sm font-medium text-gray-700'>
                                State:
                            </span>
                            <div className='flex items-center space-x-3'>
                                <ArcToggleComponent
                                    isActive={pipelineState}
                                    onToggle={() =>
                                        setPipelineState(!pipelineState)
                                    }
                                    size={150}
                                />
                                <span
                                    className={`text-sm font-medium ${
                                        pipelineState
                                            ? 'text-green-600'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {pipelineState ? 'ON' : 'OFF'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Center - Action Buttons */}
            <div className='flex items-center space-x-4'>
                <button
                    onClick={() => setShowTemplateModal(true)}
                    className='px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium flex items-center space-x-2'
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
                            d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                        />
                    </svg>
                    <span>Copy from Template</span>
                </button>

                <button className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium'>
                    Publish
                </button>

                <div className='relative'>
                    <button
                        onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                        className='flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium'
                    >
                        <span>Save</span>
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
                                d='M19 9l-7 7-7-7'
                            />
                        </svg>
                    </button>

                    {showSaveDropdown && (
                        <div className='absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
                            <button
                                onClick={() => onSave(false)}
                                className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg'
                            >
                                Save
                            </button>
                            <button
                                onClick={() => onSave(true)}
                                className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg'
                            >
                                Save As...
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={onFormatCanvas}
                    className='px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium'
                >
                    Format Canvas
                </button>
            </div>

            {/* Right Side - Canvas Label */}
            <div className='text-lg font-semibold text-gray-900'>
                Pipeline Canvas
            </div>

            {/* Copy from Template Modal */}
            {showTemplateModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden'>
                        <div className='p-6 border-b border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-semibold text-gray-900'>
                                    Copy from Existing Pipeline
                                </h2>
                                <button
                                    onClick={() => setShowTemplateModal(false)}
                                    className='text-gray-400 hover:text-gray-600 transition-colors'
                                >
                                    <svg
                                        className='w-6 h-6'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                        />
                                    </svg>
                                </button>
                            </div>
                            <p className='text-gray-600 mt-2'>
                                Select a pipeline template to copy its
                                configuration to your current pipeline.
                            </p>
                        </div>

                        <div className='p-6 overflow-y-auto max-h-[60vh]'>
                            {availableTemplates.length === 0 ? (
                                <div className='text-center py-12'>
                                    <svg
                                        className='w-16 h-16 text-gray-300 mx-auto mb-4'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={1}
                                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                        />
                                    </svg>
                                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                                        No Templates Available
                                    </h3>
                                    <p className='text-gray-600'>
                                        Create some pipeline templates first to
                                        copy from them.
                                    </p>
                                </div>
                            ) : (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {availableTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            className='border border-gray-200 rounded-lg p-4 hover:border-orange-500 hover:shadow-md transition-all duration-200 cursor-pointer'
                                            onClick={() => {
                                                if (onCopyFromTemplate) {
                                                    onCopyFromTemplate(
                                                        template.id,
                                                    );
                                                }
                                                setShowTemplateModal(false);
                                            }}
                                        >
                                            <div className='flex items-start justify-between'>
                                                <div className='flex-1'>
                                                    <h3 className='font-semibold text-gray-900 mb-1'>
                                                        {template.name}
                                                    </h3>
                                                    <p className='text-sm text-gray-600 mb-2'>
                                                        {template.description}
                                                    </p>
                                                    <div className='flex items-center space-x-4 text-xs text-gray-500'>
                                                        <span>
                                                            <strong>
                                                                Type:
                                                            </strong>{' '}
                                                            {
                                                                template.deploymentType
                                                            }
                                                        </span>
                                                        <span>
                                                            <strong>
                                                                Created:
                                                            </strong>{' '}
                                                            {
                                                                template.creationDate
                                                            }
                                                        </span>
                                                    </div>
                                                    {template.details && (
                                                        <div className='mt-2 text-xs text-gray-500'>
                                                            <span>
                                                                <strong>
                                                                    Enterprise:
                                                                </strong>{' '}
                                                                {
                                                                    template
                                                                        .details
                                                                        .enterprise
                                                                }{' '}
                                                                |
                                                                <strong>
                                                                    {' '}
                                                                    Entity:
                                                                </strong>{' '}
                                                                {
                                                                    template
                                                                        .details
                                                                        .entity
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        template.status ===
                                                        'Active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {template.status}
                                                </div>
                                            </div>
                                            <div className='mt-3 flex items-center justify-between'>
                                                <div className='flex items-center text-orange-600'>
                                                    <svg
                                                        className='w-4 h-4 mr-1'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                                                        />
                                                    </svg>
                                                    <span className='text-sm font-medium'>
                                                        Click to Copy
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
