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

export const ENTITIES = [
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
