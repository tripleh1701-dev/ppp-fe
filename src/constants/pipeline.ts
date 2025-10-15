import {WorkflowNodeType} from '@/types/workflow';

// Default values for pipeline configuration
export const PIPELINE_DEFAULTS = {
    DEPLOYMENT_TYPE: 'Integration' as const,
    MODE: 'edit' as const,
    PIPELINE_NAME: 'New Pipeline',
    STATE: true,
} as const;

// Deployment type options
export const DEPLOYMENT_TYPES = [
    {value: 'Integration', label: 'Integration'},
    {value: 'Extension', label: 'Extension'},
] as const;

// Pipeline modes
export const PIPELINE_MODES = {
    EDIT: 'edit',
    CREATE: 'create',
    PREVIEW: 'preview',
} as const;

// URL parameter keys
export const URL_PARAMS = {
    MODE: 'mode',
    TEMPLATE_ID: 'templateId',
    NAME: 'name',
    ENTERPRISE: 'enterprise',
    ENTITY: 'entity',
    DEPLOYMENT_TYPE: 'deploymentType',
} as const;

// Node type mappings
export const STEP_TYPE_TO_NODE_TYPE: Record<string, WorkflowNodeType> = {
    source: 'code_github',
    build: 'build_jenkins',
    test: 'test_jest',
    deploy: 'deploy_kubernetes',
    approval: 'approval_manual',
} as const;

// Node labels mapping
export const NODE_LABELS: Record<WorkflowNodeType, string> = {
    // Nodes (Environments)
    node_dev: 'Development',
    node_qa: 'QA/Staging',
    node_prod: 'Production',
    // Plan
    plan_jira: 'Jira',
    plan_azure_devops: 'Azure DevOps',
    plan_trello: 'Trello',
    plan_asana: 'Asana',
    // Code
    code_github: 'GitHub',
    code_gitlab: 'GitLab',
    code_azure_repos: 'Azure Repos',
    code_bitbucket: 'Bitbucket',
    code_sonarqube: 'SonarQube',
    // Build
    build_jenkins: 'Jenkins',
    build_github_actions: 'GitHub Actions',
    build_circleci: 'CircleCI',
    build_aws_codebuild: 'AWS CodeBuild',
    build_google_cloud_build: 'Google Cloud Build',
    build_azure_devops: 'Azure Pipelines',
    // Test
    test_cypress: 'Cypress',
    test_selenium: 'Selenium',
    test_jest: 'Jest',
    test_tricentis_tosca: 'Tricentis Tosca',
    // Release
    release_argo_cd: 'Argo CD',
    release_servicenow: 'ServiceNow',
    release_azure_devops: 'Azure DevOps Release',
    // Deploy
    deploy_kubernetes: 'Kubernetes',
    deploy_helm: 'Helm',
    deploy_terraform: 'Terraform',
    deploy_ansible: 'Ansible',
    deploy_docker: 'Docker',
    deploy_aws_codepipeline: 'AWS CodePipeline',
    deploy_cloudfoundry: 'Cloud Foundry',
    // Approval
    approval_manual: 'Manual Approval',
    approval_slack: 'Slack Approval',
    approval_teams: 'Teams Approval',
    // Annotations
    note: 'Sticky Note',
    comment: 'Comment',
} as const;

// Template flow configurations
export const TEMPLATE_FLOWS: Record<string, any[]> = {
    'sap-integration-suite': [
        {id: 'source', title: 'Source Code', type: 'source'},
        {id: 'validate', title: 'Validate Artifacts', type: 'test'},
        {id: 'build', title: 'Package Integration Flows', type: 'build'},
        {
            id: 'test-deploy',
            title: 'Deploy to Test Environment',
            type: 'deploy',
        },
        {id: 'integration-test', title: 'Integration Testing', type: 'test'},
        {id: 'approval', title: 'Production Approval', type: 'approval'},
        {id: 'prod-deploy', title: 'Deploy to Production', type: 'deploy'},
        {id: 'monitoring', title: 'Post-Deployment Monitoring', type: 'test'},
    ],
    'sap-s4hana-extension': [
        {id: 'source', title: 'Source Code', type: 'source'},
        {id: 'install', title: 'Install Dependencies', type: 'build'},
        {id: 'build', title: 'Build CAP Application', type: 'build'},
        {id: 'test', title: 'Run Tests', type: 'test'},
        {id: 'package', title: 'Package Application', type: 'build'},
        {id: 'approval', title: 'Deployment Approval', type: 'approval'},
        {id: 'deploy', title: 'Deploy to Cloud Foundry', type: 'deploy'},
        {id: 'verify', title: 'Verify Deployment', type: 'test'},
    ],
    'fiori-app': [
        {id: 'source', title: 'Source Code', type: 'source'},
        {id: 'build', title: 'Build UI5 App', type: 'build'},
        {id: 'test', title: 'UI Tests', type: 'test'},
        {id: 'package', title: 'Create Deployment Package', type: 'build'},
        {id: 'approval', title: 'Release Approval', type: 'approval'},
        {id: 'deploy', title: 'Deploy to Launchpad', type: 'deploy'},
    ],
    'mobile-services': [
        {id: 'source', title: 'Source Code', type: 'source'},
        {id: 'build', title: 'Build Mobile App', type: 'build'},
        {id: 'test', title: 'Device Testing', type: 'test'},
        {id: 'package', title: 'Package for Distribution', type: 'build'},
        {id: 'approval', title: 'Store Approval', type: 'approval'},
        {id: 'deploy', title: 'Deploy to App Store', type: 'deploy'},
    ],
    'bas-devspace': [
        {id: 'source', title: 'Source Code', type: 'source'},
        {id: 'validate', title: 'Validate Configuration', type: 'test'},
        {id: 'build', title: 'Build DevSpace Image', type: 'build'},
        {id: 'test', title: 'Test DevSpace', type: 'test'},
        {id: 'approval', title: 'Deployment Approval', type: 'approval'},
        {id: 'deploy', title: 'Deploy to BAS', type: 'deploy'},
    ],
    'abap-cloud': [
        {id: 'source', title: 'ABAP Source', type: 'source'},
        {id: 'syntax-check', title: 'Syntax Check', type: 'test'},
        {id: 'build', title: 'Build ABAP Package', type: 'build'},
        {id: 'unit-test', title: 'ABAP Unit Tests', type: 'test'},
        {id: 'approval', title: 'Transport Approval', type: 'approval'},
        {id: 'deploy', title: 'Transport to Production', type: 'deploy'},
    ],
} as const;

// Auto-save configuration
export const AUTO_SAVE_CONFIG = {
    DEBOUNCE_DELAY: 1000, // 1 second
    STORAGE_KEY: 'pipelineConfigurations',
    TEMPLATES_STORAGE_KEY: 'pipelineTemplates',
} as const;
