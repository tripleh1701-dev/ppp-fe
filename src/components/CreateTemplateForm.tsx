'use client';

import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    ENTERPRISES,
    DEPLOYMENT_TYPE_OPTIONS,
    FORM_DEFAULTS,
    FORM_VALIDATION,
} from '@/constants/formOptions';

export interface TemplateFormData {
    name: string;
    description: string;
    enterprise: string;
    entity: string;
    deploymentType: 'Integration' | 'Extension' | '';
}

interface CreateTemplateFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TemplateFormData) => void;
}

// Constants are now imported from formOptions

export default function CreateTemplateForm({
    isOpen,
    onClose,
    onSubmit,
}: CreateTemplateFormProps) {
    const [formData, setFormData] = useState<TemplateFormData>({
        name: FORM_DEFAULTS.NAME,
        description: FORM_DEFAULTS.DESCRIPTION,
        enterprise: FORM_DEFAULTS.ENTERPRISE,
        entity: FORM_DEFAULTS.ENTITY,
        deploymentType: FORM_DEFAULTS.DEPLOYMENT_TYPE,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (
        field: keyof TemplateFormData,
        value: string,
    ) => {
        setFormData((prev) => ({...prev, [field]: value}));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({...prev, [field]: ''}));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Template name is required';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        if (!formData.enterprise) {
            newErrors.enterprise = 'Please select an enterprise';
        }
        if (!formData.entity) {
            newErrors.entity = 'Please select an entity';
        }
        if (!formData.deploymentType) {
            newErrors.deploymentType = 'Please select a deployment type';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
            // Reset form
            setFormData({
                name: '',
                description: '',
                enterprise: '',
                entity: '',
                deploymentType: '',
            });
            setErrors({});
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            enterprise: '',
            entity: '',
            deploymentType: '',
        });
        setErrors({});
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
                        onClick={handleClose}
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{scale: 0.9, opacity: 0, y: 20}}
                            animate={{scale: 1, opacity: 1, y: 0}}
                            exit={{scale: 0.9, opacity: 0, y: 20}}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 300,
                            }}
                            className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className='px-6 py-4 border-b border-gray-200'>
                                <div className='flex items-center justify-between'>
                                    <h2 className='text-xl font-semibold text-gray-900'>
                                        Create New Pipeline Template
                                    </h2>
                                    <button
                                        onClick={handleClose}
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
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleSubmit}
                                className='p-6 space-y-6'
                            >
                                {/* Template Name */}
                                <div>
                                    <label
                                        htmlFor='name'
                                        className='block text-sm font-medium text-gray-700 mb-1'
                                    >
                                        Template Name *
                                    </label>
                                    <input
                                        type='text'
                                        id='name'
                                        value={formData.name}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder='e.g., SAP Finance Integration, Oracle Payroll Extension'
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.name
                                                ? 'border-red-300'
                                                : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.name && (
                                        <p className='mt-1 text-sm text-red-600'>
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label
                                        htmlFor='description'
                                        className='block text-sm font-medium text-gray-700 mb-1'
                                    >
                                        Description *
                                    </label>
                                    <textarea
                                        id='description'
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder='Describe what this template does and its purpose...'
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.description
                                                ? 'border-red-300'
                                                : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.description && (
                                        <p className='mt-1 text-sm text-red-600'>
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Enterprise */}
                                <div>
                                    <label
                                        htmlFor='enterprise'
                                        className='block text-sm font-medium text-gray-700 mb-1'
                                    >
                                        Select Enterprise *
                                    </label>
                                    <select
                                        id='enterprise'
                                        value={formData.enterprise}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'enterprise',
                                                e.target.value,
                                            )
                                        }
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.enterprise
                                                ? 'border-red-300'
                                                : 'border-gray-300'
                                        }`}
                                    >
                                        <option value=''>
                                            Choose an enterprise...
                                        </option>
                                        {ENTERPRISES.map((enterprise) => (
                                            <option
                                                key={enterprise}
                                                value={enterprise}
                                            >
                                                {enterprise}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.enterprise && (
                                        <p className='mt-1 text-sm text-red-600'>
                                            {errors.enterprise}
                                        </p>
                                    )}
                                </div>

                                {/* Entity */}
                                <div>
                                    <label
                                        htmlFor='entity'
                                        className='block text-sm font-medium text-gray-700 mb-1'
                                    >
                                        Select Entity *
                                    </label>
                                    <select
                                        id='entity'
                                        value={formData.entity}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'entity',
                                                e.target.value,
                                            )
                                        }
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.entity
                                                ? 'border-red-300'
                                                : 'border-gray-300'
                                        }`}
                                    >
                                        <option value=''>
                                            Choose an entity...
                                        </option>
                                        {[].map((entity) => (
                                            <option key={entity} value={entity}>
                                                {entity}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.entity && (
                                        <p className='mt-1 text-sm text-red-600'>
                                            {errors.entity}
                                        </p>
                                    )}
                                </div>

                                {/* Deployment Type */}
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-3'>
                                        Select Deployment Type *
                                    </label>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        {DEPLOYMENT_TYPE_OPTIONS.map((type) => (
                                            <label
                                                key={type.value}
                                                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                                                    formData.deploymentType ===
                                                    type.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-300 bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type='radio'
                                                    name='deploymentType'
                                                    value={type.value}
                                                    checked={
                                                        formData.deploymentType ===
                                                        type.value
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            'deploymentType',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className='sr-only'
                                                />
                                                <div className='flex w-full items-center justify-between'>
                                                    <div className='flex items-center'>
                                                        <div className='text-sm'>
                                                            <div className='font-medium text-gray-900'>
                                                                {type.label}
                                                            </div>
                                                            <div className='text-gray-500'>
                                                                {
                                                                    type.description
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {formData.deploymentType ===
                                                        type.value && (
                                                        <div className='text-blue-600'>
                                                            <svg
                                                                className='h-5 w-5'
                                                                fill='currentColor'
                                                                viewBox='0 0 20 20'
                                                            >
                                                                <path
                                                                    fillRule='evenodd'
                                                                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                                                    clipRule='evenodd'
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.deploymentType && (
                                        <p className='mt-1 text-sm text-red-600'>
                                            {errors.deploymentType}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-200'>
                                    <button
                                        type='button'
                                        onClick={handleClose}
                                        className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        className='px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    >
                                        Next: Open Canvas
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
