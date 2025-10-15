/**
 * Shared configuration for tools/connectors across Global Settings and Pipeline Canvas
 * This ensures consistency in tool names, icons, and categories
 */

export interface ToolConfig {
    name: string;
    iconName: string;
    category: string;
}

export type ToolCategory =
    | 'plan'
    | 'code'
    | 'build'
    | 'test'
    | 'release'
    | 'deploy';

// Mapping of tool names to their configuration
export const TOOLS_CONFIG: Record<string, ToolConfig> = {
    // Plan tools
    Jira: {name: 'Jira', iconName: 'jira', category: 'plan'},
    'Azure DevOps': {name: 'Azure DevOps', iconName: 'azdo', category: 'plan'},
    Trello: {name: 'Trello', iconName: 'trello', category: 'plan'},
    Asana: {name: 'Asana', iconName: 'asana', category: 'plan'},

    // Code tools
    GitHub: {name: 'GitHub', iconName: 'github', category: 'code'},
    GitLab: {name: 'GitLab', iconName: 'gitlab', category: 'code'},
    'Azure Repos': {name: 'Azure Repos', iconName: 'azure', category: 'code'},
    Bitbucket: {name: 'Bitbucket', iconName: 'bitbucket', category: 'code'},
    SonarQube: {name: 'SonarQube', iconName: 'sonarqube', category: 'code'},

    // Build tools
    Jenkins: {name: 'Jenkins', iconName: 'jenkins', category: 'build'},
    'GitHub Actions': {
        name: 'GitHub Actions',
        iconName: 'github',
        category: 'build',
    },
    CircleCI: {name: 'CircleCI', iconName: 'circleci', category: 'build'},
    'AWS CodeBuild': {
        name: 'AWS CodeBuild',
        iconName: 'aws',
        category: 'build',
    },
    'Google Cloud Build': {
        name: 'Google Cloud Build',
        iconName: 'cloudbuild',
        category: 'build',
    },

    // Test tools
    Cypress: {name: 'Cypress', iconName: 'cypress', category: 'test'},
    Selenium: {name: 'Selenium', iconName: 'selenium', category: 'test'},
    Jest: {name: 'Jest', iconName: 'jest', category: 'test'},
    'Tricentis Tosca': {
        name: 'Tricentis Tosca',
        iconName: 'asana',
        category: 'test',
    },

    // Release tools
    'Argo CD': {name: 'Argo CD', iconName: 'argo', category: 'release'},
    ServiceNow: {name: 'ServiceNow', iconName: 'slack', category: 'release'},

    // Deploy tools
    Kubernetes: {
        name: 'Kubernetes',
        iconName: 'kubernetes',
        category: 'deploy',
    },
    Helm: {name: 'Helm', iconName: 'helm', category: 'deploy'},
    Terraform: {name: 'Terraform', iconName: 'terraform', category: 'deploy'},
    Ansible: {name: 'Ansible', iconName: 'ansible', category: 'deploy'},
    Docker: {name: 'Docker', iconName: 'docker', category: 'deploy'},
    'AWS CodePipeline': {
        name: 'AWS CodePipeline',
        iconName: 'codepipeline',
        category: 'deploy',
    },
    'Cloud Foundry': {
        name: 'Cloud Foundry',
        iconName: 'cloudfoundry',
        category: 'deploy',
    },
};

// Category-based tool lists (what appears in Global Settings)
export const CATEGORY_TOOLS: Record<ToolCategory, string[]> = {
    plan: ['Jira', 'Azure DevOps', 'Trello', 'Asana'],
    code: ['GitHub', 'GitLab', 'Azure Repos', 'Bitbucket', 'SonarQube'],
    build: [
        'Jenkins',
        'GitHub Actions',
        'CircleCI',
        'AWS CodeBuild',
        'Google Cloud Build',
        'Azure DevOps',
    ],
    test: ['Cypress', 'Selenium', 'Jest', 'Tricentis Tosca'],
    release: ['Argo CD', 'ServiceNow', 'Azure DevOps'],
    deploy: [
        'Kubernetes',
        'Helm',
        'Terraform',
        'Ansible',
        'Docker',
        'AWS CodePipeline',
        'Cloud Foundry',
    ],
};

// Category colors
export const CATEGORY_COLORS: Record<ToolCategory, string> = {
    plan: '#6366F1',
    code: '#22C55E',
    build: '#F59E0B',
    test: '#06B6D4',
    release: '#EC4899',
    deploy: '#8B5CF6',
};

// Category display order
export const CATEGORY_ORDER: ToolCategory[] = [
    'plan',
    'code',
    'build',
    'test',
    'release',
    'deploy',
];

/**
 * Get tool configuration by name
 */
export function getToolConfig(toolName: string): ToolConfig | undefined {
    return TOOLS_CONFIG[toolName];
}

/**
 * Get all tools for a specific category
 */
export function getToolsByCategory(category: ToolCategory): string[] {
    return CATEGORY_TOOLS[category] || [];
}

/**
 * Get tools that should be enabled based on global settings configuration
 */
export function getEnabledTools(
    globalSettingsConfig: Record<ToolCategory, string[]>,
): Set<string> {
    const enabled = new Set<string>();
    Object.entries(globalSettingsConfig).forEach(([category, tools]) => {
        tools.forEach((tool) => enabled.add(tool));
    });
    return enabled;
}
