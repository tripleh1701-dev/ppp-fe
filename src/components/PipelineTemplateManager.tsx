'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import PipelineTemplateDashboard from './PipelineTemplateDashboard';
import CreateTemplateForm, {TemplateFormData} from './CreateTemplateForm';
import {AUTO_SAVE_CONFIG} from '@/constants/pipeline';
import {buildCanvasURL, logPipelineDebug} from '@/utils/pipelineUtils';
import {api} from '@/utils/api';

export default function PipelineTemplateManager() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const router = useRouter();

    // Function to determine flow template based on enterprise and deployment type
    const getFlowTemplateId = (
        enterprise: string,
        deploymentType: string,
    ): string => {
        if (enterprise.toLowerCase().includes('sap')) {
            return deploymentType === 'Integration'
                ? 'sap-integration-suite'
                : 'sap-s4hana-extension';
        }
        // Default templates for other enterprises
        return deploymentType === 'Integration'
            ? 'sap-integration-suite'
            : 'sap-s4hana-extension';
    };

    const handleCreateTemplate = async (formData: TemplateFormData) => {
        // Create a new template ID
        const templateId = `template-${Date.now()}`;

        const templateData = {
            id: templateId,
            name: formData.name,
            description: formData.description,
            details: {
                enterprise: formData.enterprise,
                entity: formData.entity,
            },
            deploymentType: formData.deploymentType as
                | 'Integration'
                | 'Extension',
            creationDate: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }),
            status: 'Draft' as const,
            flowTemplateId: getFlowTemplateId(
                formData.enterprise,
                formData.deploymentType,
            ),
        };

        await api.post('/api/templates', templateData);

        // Close form
        setShowCreateForm(false);

        // Navigate to canvas with template data
        logPipelineDebug('Form Data being passed to canvas', formData);

        const canvasUrl = buildCanvasURL({
            mode: 'create',
            templateId,
            name: formData.name,
            enterprise: formData.enterprise,
            entity: formData.entity,
            deploymentType: formData.deploymentType,
        });

        logPipelineDebug('Canvas URL', canvasUrl);
        router.push(canvasUrl);
    };

    return (
        <>
            <PipelineTemplateDashboard
                onCreateNew={() => setShowCreateForm(true)}
            />

            <CreateTemplateForm
                isOpen={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                onSubmit={handleCreateTemplate}
            />
        </>
    );
}
