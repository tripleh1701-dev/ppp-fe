// Form options for template creation
export const ENTERPRISES = [
    'SAP',
    'Oracle',
    'Microsoft',
    'Salesforce',
    'ServiceNow',
    'Workday',
    'Adobe',
    'AWS',
    'Google Cloud',
    'Azure',
] as const;

// Dynamic entities - to be loaded from database
export interface Entity {
    id: number;
    name: string;
    description?: string;
    entity_type: string;
    status: string;
}

// Dynamic services - to be loaded from database
export interface Service {
    id: number;
    name: string;
    description?: string;
    service_code: string;
    category: string;
    status: string;
}

// Dynamic roles - to be loaded from database
export interface Role {
    id: number;
    name: string;
    description?: string;
    role_code: string;
    role_level: number;
    permissions: string[];
    status: string;
}

// Dynamic user groups - to be loaded from database
export interface UserGroup {
    id: number;
    name: string;
    description?: string;
    group_code: string;
    status: string;
    account_id: number;
    enterprise_id: number;
}

// Fallback entities (used only if database is unavailable)
export const FALLBACK_ENTITIES = [
    'Finance',
    'Payroll',
    'People',
    'HR',
    'Sales',
    'Marketing',
    'Customer Service',
    'Supply Chain',
    'Procurement',
    'Analytics',
    'Security',
    'IT Operations',
] as const;

export const DEPLOYMENT_TYPE_OPTIONS = [
    {
        value: 'Integration' as const,
        label: 'Integration',
        description: 'Connect and integrate systems',
    },
    {
        value: 'Extension' as const,
        label: 'Extension',
        description: 'Extend existing functionality',
    },
] as const;

// Form validation patterns
export const FORM_VALIDATION = {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 200,
} as const;

// Form default values
export const FORM_DEFAULTS = {
    NAME: '',
    DESCRIPTION: '',
    ENTERPRISE: '',
    ENTITY: '',
    DEPLOYMENT_TYPE: '' as const,
} as const;
