import {Node, Edge} from 'reactflow';

export type WorkflowNodeType =
    // Nodes (Environments)
    | 'node_dev'
    | 'node_qa'
    | 'node_prod'
    // Plan
    | 'plan_jira'
    | 'plan_trello'
    | 'plan_asana'
    // Code
    | 'code_github'
    | 'code_gitlab'
    | 'code_bitbucket'
    // Build
    | 'build_jenkins'
    | 'build_github_actions'
    | 'build_azure_pipelines'
    // Test
    | 'test_jest'
    | 'test_selenium'
    | 'test_cypress'
    // Deploy
    | 'deploy_kubernetes'
    | 'deploy_helm'
    | 'deploy_aws'
    | 'deploy_gcp'
    | 'deploy_azure'
    // Approval
    | 'approval_manual'
    | 'approval_slack'
    | 'approval_teams'
    // Release
    | 'release_docker'
    | 'release_npm'
    | 'release_maven'
    // Annotations
    | 'note'
    | 'comment';

export interface CircularToggleConfig {
    success: {
        message: string;
        enabled: boolean;
        notifications: {
            email: boolean;
            slack: boolean;
        };
    };
    warning: {
        message: string;
        enabled: boolean;
        notifications: {
            email: boolean;
            slack: boolean;
        };
    };
    failure: {
        message: string;
        enabled: boolean;
        notifications: {
            email: boolean;
            slack: boolean;
        };
        actions: {
            rollback: boolean;
            retrigger: boolean;
            notify: boolean;
        };
    };
}

export interface WorkflowNodeData {
    label: string;
    type: WorkflowNodeType;
    status?: 'pending' | 'running' | 'completed' | 'failed';
    description?: string;
    config?: Record<string, any>;
    duration?: string;
    stage?: string;
    identifier?: string;
    circularToggleConfig?: CircularToggleConfig;
    showCircularToggle?: boolean;
}

export interface WorkflowNode extends Node {
    data: WorkflowNodeData;
}

export interface WorkflowEdge extends Omit<Edge, 'id'> {
    id: string;
    animated?: boolean;
}

export interface SidebarItem {
    type: WorkflowNodeType;
    label: string;
    icon: string;
    description: string;
    color: string;
    category: string;
}

export interface SidebarCategory {
    id: string;
    label: string;
    icon: string;
    description: string;
    items: SidebarItem[];
}

export interface PipelineVariable {
    name: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'secret';
    description?: string;
}

export interface PipelineConfig {
    variables: PipelineVariable[];
    notifications: {
        email: string[];
        slack: string[];
        teams: string[];
    };
    triggers: {
        push: boolean;
        pullRequest: boolean;
        schedule?: string;
    };
}
