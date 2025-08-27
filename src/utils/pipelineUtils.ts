import {WorkflowNodeType} from '@/types/workflow';
import {
    PIPELINE_DEFAULTS,
    STEP_TYPE_TO_NODE_TYPE,
    NODE_LABELS,
    URL_PARAMS,
    DEPLOYMENT_TYPES,
} from '@/constants/pipeline';

// Types for parameter parsing
export interface URLPipelineParams {
    mode: string;
    templateName: string;
    enterprise: string;
    entity: string;
    deploymentType: string;
}

export interface PipelineState {
    pipelineName: string;
    deploymentType: string;
    description: string;
}

// Utility functions for node operations
export const getNodeTypeFromStepType = (stepType: string): WorkflowNodeType => {
    return (
        STEP_TYPE_TO_NODE_TYPE[stepType] ||
        (PIPELINE_DEFAULTS.DEPLOYMENT_TYPE as WorkflowNodeType)
    );
};

export const getNodeLabel = (nodeType: WorkflowNodeType): string => {
    return NODE_LABELS[nodeType] || 'Unknown';
};

// URL parameter parsing utilities
export const parseURLParams = (searchParams: string): URLPipelineParams => {
    const params = new URLSearchParams(searchParams);

    return {
        mode: params.get(URL_PARAMS.MODE) || PIPELINE_DEFAULTS.MODE,
        templateName: params.get(URL_PARAMS.NAME) || '',
        enterprise: params.get(URL_PARAMS.ENTERPRISE) || '',
        entity: params.get(URL_PARAMS.ENTITY) || '',
        deploymentType:
            params.get(URL_PARAMS.DEPLOYMENT_TYPE) ||
            PIPELINE_DEFAULTS.DEPLOYMENT_TYPE,
    };
};

// Generate intelligent pipeline name
export const generatePipelineName = (
    templateName: string,
    enterprise: string,
    entity: string,
): string => {
    if (templateName) return templateName;
    if (enterprise && entity) return `${enterprise} ${entity} Pipeline`;
    return PIPELINE_DEFAULTS.PIPELINE_NAME;
};

// Generate pipeline description
export const generatePipelineDescription = (
    enterprise: string,
    entity: string,
): string => {
    return enterprise && entity ? `${enterprise} ${entity} Pipeline` : '';
};

// Create pipeline state from URL parameters
export const createPipelineStateFromParams = (
    params: URLPipelineParams,
): PipelineState => {
    return {
        pipelineName: generatePipelineName(
            params.templateName,
            params.enterprise,
            params.entity,
        ),
        deploymentType: params.deploymentType,
        description: generatePipelineDescription(
            params.enterprise,
            params.entity,
        ),
    };
};

// Validate deployment type
export const isValidDeploymentType = (type: string): boolean => {
    return DEPLOYMENT_TYPES.some((option) => option.value === type);
};

// Generate unique node ID
let nodeIdCounter = 0;
export const generateNodeId = (): string => `node-${++nodeIdCounter}`;

// Reset node counter (useful for testing)
export const resetNodeCounter = (): void => {
    nodeIdCounter = 0;
};

// Debug logging utility
export const logPipelineDebug = (message: string, data: any): void => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Pipeline Debug] ${message}:`, data);
    }
};

// Storage utilities
export const getStorageKey = (key: string): string => {
    return `pipeline_${key}`;
};

// Template data interface
export interface TemplateData {
    mode?: string;
    name: string;
    enterprise: string;
    entity: string;
    deploymentType: string;
}

// Create pipeline state from template data
export const createPipelineStateFromTemplate = (
    templateData: TemplateData,
): PipelineState => {
    return {
        pipelineName: templateData.name,
        deploymentType: templateData.deploymentType,
        description: generatePipelineDescription(
            templateData.enterprise,
            templateData.entity,
        ),
    };
};

// URL construction helper
export const buildCanvasURL = (params: {
    mode: string;
    templateId: string;
    name: string;
    enterprise: string;
    entity: string;
    deploymentType: string;
}): string => {
    const urlParams = new URLSearchParams({
        [URL_PARAMS.MODE]: params.mode,
        [URL_PARAMS.TEMPLATE_ID]: params.templateId,
        [URL_PARAMS.NAME]: params.name,
        [URL_PARAMS.ENTERPRISE]: params.enterprise,
        [URL_PARAMS.ENTITY]: params.entity,
        [URL_PARAMS.DEPLOYMENT_TYPE]: params.deploymentType,
    });

    return `/pipelines/canvas?${urlParams.toString()}`;
};
