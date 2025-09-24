'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WorkflowBuilder from './WorkflowBuilder';
import {AUTO_SAVE_CONFIG} from '@/constants/pipeline';
import {logPipelineDebug} from '@/utils/pipelineUtils';
import {loadPipelineYAML, convertFromYAML} from '@/utils/yamlPipelineUtils';
import {api} from '@/utils/api';

export interface PipelineTemplate {
    id: string;
    name: string;
    details: {
        enterprise: string;
        entity: string;
    };
    deploymentType: 'Integration' | 'Extension';
    status: 'Active' | 'Inactive' | 'Draft';
    creationDate: string;
    description?: string;
    flowTemplateId?: string; // Maps to TEMPLATE_FLOWS keys
}

// Templates loaded from API

interface PipelineTemplateDashboardProps {
    onCreateNew?: () => void;
}

interface ViewState {
    isViewing: boolean;
    template: PipelineTemplate | null;
}

export default function PipelineTemplateDashboard({
    onCreateNew,
}: PipelineTemplateDashboardProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
    const [viewState, setViewState] = useState<ViewState>({
        isViewing: false,
        template: null,
    });

    // Load templates from backend on mount
    useEffect(() => {
        const loadTemplates = () => {
            try {
                (async () => {
                    const templates = await api.get<PipelineTemplate[]>(
                        '/api/templates',
                    );
                    if (templates && Array.isArray(templates)) {
                        setTemplates(templates);
                    } else {
                        setTemplates([]);
                    }
                })();
            } catch (error) {
                console.error('Error loading templates:', error);
                setTemplates([]);
            }
        };

        loadTemplates();
    }, []);

    const filteredTemplates = templates.filter(
        (template) =>
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (template.details?.enterprise || '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            (template.details?.entity || '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Inactive':
                return 'bg-red-100 text-red-800';
            case 'Draft':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleView = async (templateId: string) => {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            const yamlContent = await loadPipelineYAML(templateId);
            if (yamlContent) {
                try {
                    const {metadata} = convertFromYAML(yamlContent);
                    logPipelineDebug('Loading template from YAML for view', {
                        templateId,
                        templateName: metadata.name,
                        yamlLength: yamlContent.length,
                    });
                } catch (error) {
                    console.warn(
                        'YAML parsing failed, will use fallback template flow:',
                        error,
                    );
                }
            } else {
                logPipelineDebug(
                    'No YAML found for template, will use fallback template flow',
                    {
                        templateId,
                        templateName: template.name,
                    },
                );
            }

            setViewState({
                isViewing: true,
                template: template,
            });
        }
    };

    const handleCloseView = () => {
        setViewState({
            isViewing: false,
            template: null,
        });
    };

    const handleEdit = (templateId: string) => {
        // Navigate to canvas in edit mode
        window.open(
            `/pipelines/canvas?template=${templateId}&mode=edit`,
            '_blank',
        );
    };

    const handleDelete = (templateId: string) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            (async () => {
                await api.del(
                    `/api/templates/${encodeURIComponent(templateId)}`,
                );
                const updatedTemplates = templates.filter(
                    (t) => t.id !== templateId,
                );
                setTemplates(updatedTemplates);
            })();
        }
    };

    // If viewing a template, show the canvas
    if (viewState.isViewing && viewState.template) {
        return (
            <div className='h-full relative'>
                {/* Back button */}
                <div className='absolute top-4 left-4 z-50'>
                    <button
                        onClick={handleCloseView}
                        className='flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200'
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
                                d='M15 19l-7-7 7-7'
                            />
                        </svg>
                        <span className='text-sm font-medium'>
                            Back to Templates
                        </span>
                    </button>
                </div>

                {/* Template info header */}
                <div className='absolute top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg p-3 shadow-sm'>
                    <div className='text-sm'>
                        <div className='font-semibold text-gray-900'>
                            {viewState.template.name}
                        </div>
                        <div className='text-gray-600'>
                            {viewState.template.details?.enterprise} •{' '}
                            {viewState.template.details?.entity}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                            <span className='inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-full'>
                                {viewState.template.deploymentType}
                            </span>
                            <span className='ml-2 inline-flex px-2 py-1 bg-gray-100 text-gray-800 rounded-full'>
                                Read Only
                            </span>
                            {/* YAML badge rendered conditionally by separate async check if needed */}
                            {/* For now omit direct call to async function in render */}
                            {false && (
                                <span className='ml-2 inline-flex px-2 py-1 bg-green-100 text-green-800 rounded-full'>
                                    YAML
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Canvas in read-only mode - loads from YAML first */}
                <WorkflowBuilder
                    templateId={viewState.template.id}
                    templateData={{
                        name: viewState.template.name,
                        enterprise:
                            viewState.template.details?.enterprise || '',
                        entity: viewState.template.details?.entity || '',
                        deploymentType: viewState.template.deploymentType,
                        mode: 'preview',
                    }}
                />
            </div>
        );
    }

    return (
        <div className='h-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 overflow-auto'>
            {/* Header */}
            <div className='bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-6 sticky top-0 z-10'>
                <div className='max-w-7xl mx-auto'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-4'>
                            <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
                                <svg
                                    className='w-6 h-6 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                                    />
                                </svg>
                            </div>
                            <h1 className='text-2xl font-bold text-gray-900'>
                                Pipeline Templates
                            </h1>
                        </div>
                        <button
                            onClick={onCreateNew}
                            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 shadow-sm'
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
                                    d='M12 4v16m8-8H4'
                                />
                            </svg>
                            <span>Create New Template</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className='p-6'>
                <div className='max-w-7xl mx-auto'>
                    {/* Search Bar */}
                    <div className='mb-6'>
                        <div className='relative max-w-md'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                <svg
                                    className='w-5 h-5 text-gray-400'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                                    />
                                </svg>
                            </div>
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder='Search templates...'
                                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                            />
                        </div>
                    </div>

                    {/* Templates Table */}
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th
                                            scope='col'
                                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                        >
                                            Template Name
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                        >
                                            Details
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                        >
                                            Deployment Type
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                        >
                                            Status
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                        >
                                            Creation Date
                                        </th>
                                        <th
                                            scope='col'
                                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {filteredTemplates.map((template) => (
                                        <tr
                                            key={template.id}
                                            className='hover:bg-gray-50'
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3'>
                                                        <svg
                                                            className='w-4 h-4 text-blue-600'
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
                                                    </div>
                                                    <div>
                                                        <div className='text-sm font-medium text-gray-900'>
                                                            {template.name}
                                                        </div>
                                                        {template.description && (
                                                            <div className='text-sm text-gray-500'>
                                                                {
                                                                    template.description
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='text-sm text-gray-900'>
                                                    <div>
                                                        Enterprise:{' '}
                                                        <span className='font-medium'>
                                                            {template.details
                                                                ?.enterprise ||
                                                                'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        Entity:{' '}
                                                        <span className='font-medium'>
                                                            {template.details
                                                                ?.entity ||
                                                                'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'>
                                                    {template.deploymentType}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                        template.status,
                                                    )}`}
                                                >
                                                    {template.status}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                {template.creationDate}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                                <div className='flex items-center space-x-2'>
                                                    {/* View Button */}
                                                    <button
                                                        onClick={() =>
                                                            handleView(
                                                                template.id,
                                                            )
                                                        }
                                                        className='text-blue-600 hover:text-blue-900 p-1 rounded'
                                                        title='View template'
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
                                                                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                                            />
                                                            <path
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                                strokeWidth={2}
                                                                d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                                            />
                                                        </svg>
                                                    </button>

                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(
                                                                template.id,
                                                            )
                                                        }
                                                        className='text-gray-600 hover:text-gray-900 p-1 rounded'
                                                        title='Edit template'
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
                                                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                                            />
                                                        </svg>
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                template.id,
                                                            )
                                                        }
                                                        className='text-red-600 hover:text-red-900 p-1 rounded'
                                                        title='Delete template'
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredTemplates.length === 0 && (
                            <div className='text-center py-12'>
                                <Image
                                    src='/images/no-templates.png'
                                    alt='No templates found'
                                    width={192}
                                    height={192}
                                    className='mx-auto object-contain'
                                />
                                <h3 className='mt-2 text-sm font-medium text-gray-900'>
                                    No templates found
                                </h3>
                                <p className='mt-1 text-sm text-gray-500'>
                                    {searchTerm
                                        ? 'Try adjusting your search terms.'
                                        : 'Get started by creating a new template.'}
                                </p>
                                {!searchTerm && (
                                    <div className='mt-6'>
                                        <button
                                            onClick={onCreateNew}
                                            className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                                        >
                                            <svg
                                                className='-ml-1 mr-2 h-4 w-4'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M12 4v16m8-8H4'
                                                />
                                            </svg>
                                            Create New Template
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
