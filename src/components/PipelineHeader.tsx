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

// Animated SVG Icon Components
const AnimatedPipelineIcon = ({className}: {className?: string}) => (
    <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <g className='animate-pulse'>
            <path
                d='M4 8h16M4 12h16M4 16h16'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                className='animate-[dash_2s_linear_infinite]'
                strokeDasharray='4 4'
            />
            <circle
                cx='6'
                cy='8'
                r='1.5'
                fill='currentColor'
                className='animate-bounce'
                style={{animationDelay: '0s'}}
            />
            <circle
                cx='18'
                cy='8'
                r='1.5'
                fill='currentColor'
                className='animate-bounce'
                style={{animationDelay: '0.5s'}}
            />
            <circle
                cx='6'
                cy='12'
                r='1.5'
                fill='currentColor'
                className='animate-bounce'
                style={{animationDelay: '1s'}}
            />
            <circle
                cx='18'
                cy='12'
                r='1.5'
                fill='currentColor'
                className='animate-bounce'
                style={{animationDelay: '1.5s'}}
            />
            <circle
                cx='6'
                cy='16'
                r='1.5'
                fill='currentColor'
                className='animate-bounce'
                style={{animationDelay: '2s'}}
            />
            <circle
                cx='18'
                cy='16'
                r='1.5'
                fill='currentColor'
                className='animate-bounce'
                style={{animationDelay: '2.5s'}}
            />
        </g>
    </svg>
);

const AnimatedServiceIcon = ({className}: {className?: string}) => (
    <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <g
            className='animate-spin'
            style={{transformOrigin: '12px 12px', animationDuration: '3s'}}
        >
            <circle
                cx='12'
                cy='12'
                r='3'
                stroke='currentColor'
                strokeWidth='2'
                fill='none'
            />
            <path
                d='M12 1v6M12 17v6M23 12h-6M7 12H1'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
            />
        </g>
        <circle
            cx='12'
            cy='12'
            r='2'
            fill='currentColor'
            className='animate-pulse'
        />
    </svg>
);

const AnimatedEntityIcon = ({className}: {className?: string}) => (
    <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <rect
            x='3'
            y='4'
            width='18'
            height='16'
            rx='2'
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
        />
        <rect
            x='6'
            y='8'
            width='4'
            height='2'
            fill='currentColor'
            className='animate-pulse'
            style={{animationDelay: '0s'}}
        />
        <rect
            x='6'
            y='12'
            width='6'
            height='2'
            fill='currentColor'
            className='animate-pulse'
            style={{animationDelay: '0.5s'}}
        />
        <rect
            x='14'
            y='8'
            width='4'
            height='6'
            fill='currentColor'
            className='animate-pulse'
            style={{animationDelay: '1s'}}
        />
        <circle
            cx='18'
            cy='6'
            r='2'
            fill='currentColor'
            className='animate-bounce'
        />
    </svg>
);

const AnimatedPublishIcon = ({className}: {className?: string}) => (
    <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M12 2L22 8.5L12 15L2 8.5L12 2Z'
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
            className='animate-pulse'
        />
        <path
            d='M2 17.5L12 24L22 17.5'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='animate-bounce'
        />
        <path
            d='M2 13L12 19.5L22 13'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='animate-bounce'
            style={{animationDelay: '0.2s'}}
        />
    </svg>
);

const AnimatedSaveIcon = ({className}: {className?: string}) => (
    <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z'
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
        />
        <polyline
            points='17,21 17,13 7,13 7,21'
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
            className='animate-pulse'
        />
        <polyline
            points='7,3 7,8 15,8'
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
            className='animate-pulse'
            style={{animationDelay: '0.5s'}}
        />
    </svg>
);

const AnimatedFormatIcon = ({className}: {className?: string}) => (
    <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <rect
            x='3'
            y='3'
            width='18'
            height='18'
            rx='2'
            stroke='currentColor'
            strokeWidth='2'
            fill='none'
        />
        <path
            d='M8 12h8M8 8h8M8 16h6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            className='animate-pulse'
        />
        <circle
            cx='18'
            cy='6'
            r='2'
            fill='currentColor'
            className='animate-ping'
        />
    </svg>
);

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
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingService, setIsEditingService] = useState(false);
    const [isEditingEntity, setIsEditingEntity] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [service, setService] = useState('Default Service');
    const [entity, setEntity] = useState('Default Entity');

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

    // Modern animated text input component
    const AnimatedTextInput = ({
        icon: Icon,
        label,
        value,
        onChange,
        isEditing,
        onEditingChange,
        placeholder,
        className = '',
    }: {
        icon: React.ComponentType<{className?: string}>;
        label: string;
        value: string;
        onChange: (value: string) => void;
        isEditing: boolean;
        onEditingChange: (editing: boolean) => void;
        placeholder?: string;
        className?: string;
    }) => (
        <div className={`group relative ${className}`}>
            <div className='bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:from-blue-50 hover:to-blue-100'>
                <div className='flex items-center space-x-3'>
                    <div className='flex-shrink-0'>
                        <Icon className='w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors duration-300' />
                    </div>
                    <div className='flex-1 min-w-0'>
                        <label className='block text-xs font-medium text-slate-600 mb-2 group-hover:text-slate-700 transition-colors duration-300'>
                            {label}
                        </label>
                        {isEditing ? (
                            <input
                                type='text'
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onBlur={() => onEditingChange(false)}
                                onKeyPress={(e) =>
                                    e.key === 'Enter' && onEditingChange(false)
                                }
                                placeholder={placeholder}
                                className='w-full bg-transparent text-lg font-semibold text-slate-900 focus:outline-none border-b-2 border-blue-400 focus:border-blue-600 transition-colors duration-200'
                                autoFocus
                            />
                        ) : (
                            <div
                                className='text-lg font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors duration-200 truncate'
                                onClick={() => onEditingChange(true)}
                                title='Click to edit'
                            >
                                {value || placeholder}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className='bg-gradient-to-r from-white via-blue-50 to-white border-b border-slate-200 px-6 py-5 shadow-sm backdrop-blur-sm'>
            {/* Main Content Grid */}
            <div className='grid grid-cols-12 gap-6 items-center'>
                {/* Left Side - Text Inputs (Pipeline, Service, Entity) */}
                <div className='col-span-7 grid grid-cols-3 gap-4'>
                    <AnimatedTextInput
                        icon={AnimatedPipelineIcon}
                        label='Pipeline Name'
                        value={pipelineName}
                        onChange={setPipelineName}
                        isEditing={isEditingName}
                        onEditingChange={setIsEditingName}
                        placeholder='Enter pipeline name'
                    />

                    <AnimatedTextInput
                        icon={AnimatedServiceIcon}
                        label='Service'
                        value={service}
                        onChange={setService}
                        isEditing={isEditingService}
                        onEditingChange={setIsEditingService}
                        placeholder='Enter service name'
                    />

                    <AnimatedTextInput
                        icon={AnimatedEntityIcon}
                        label='Entity'
                        value={entity}
                        onChange={setEntity}
                        isEditing={isEditingEntity}
                        onEditingChange={setIsEditingEntity}
                        placeholder='Enter entity name'
                    />
                </div>

                {/* Center - Action Buttons */}
                <div className='col-span-4 flex items-center justify-center space-x-3'>
                    <button className='group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105'>
                        <div className='flex items-center space-x-2'>
                            <AnimatedPublishIcon className='w-5 h-5' />
                            <span>Publish</span>
                        </div>
                        <div className='absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                    </button>

                    <div className='relative'>
                        <button
                            onClick={() =>
                                setShowSaveDropdown(!showSaveDropdown)
                            }
                            className='group relative px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105'
                        >
                            <div className='flex items-center space-x-2'>
                                <AnimatedSaveIcon className='w-5 h-5' />
                                <span>Save</span>
                                <svg
                                    className='w-4 h-4 transition-transform duration-200 group-hover:rotate-180'
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
                            </div>
                            <div className='absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                        </button>

                        {showSaveDropdown && (
                            <div className='absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-[slideDown_200ms_ease-out]'>
                                <button
                                    onClick={() => onSave(false)}
                                    className='w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-200 rounded-t-xl flex items-center space-x-2'
                                >
                                    <AnimatedSaveIcon className='w-4 h-4' />
                                    <span>Save</span>
                                </button>
                                <button
                                    onClick={() => onSave(true)}
                                    className='w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-200 rounded-b-xl flex items-center space-x-2'
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
                                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                        />
                                    </svg>
                                    <span>Save as Template</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onFormatCanvas}
                        className='group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105'
                    >
                        <div className='flex items-center space-x-2'>
                            <AnimatedFormatIcon className='w-5 h-5' />
                            <span>Format</span>
                        </div>
                        <div className='absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                    </button>
                </div>

                {/* Right Side - State Toggle */}
                <div className='col-span-1 flex justify-end'>
                    <div className='bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-green-300 hover:from-green-50 hover:to-green-100'>
                        <div className='flex flex-col items-center space-y-2'>
                            <span className='text-xs font-medium text-slate-600'>
                                State
                            </span>
                            <ArcToggleComponent
                                isActive={pipelineState}
                                onToggle={() =>
                                    setPipelineState(!pipelineState)
                                }
                                size={120}
                            />
                            <span
                                className={`text-xs font-semibold ${
                                    pipelineState
                                        ? 'text-green-600'
                                        : 'text-slate-500'
                                } transition-colors duration-300`}
                            >
                                {pipelineState ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
