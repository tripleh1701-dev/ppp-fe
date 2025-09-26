'use client';

import {Handle, Position, NodeProps} from 'reactflow';
import {WorkflowNodeData, CircularToggleConfig} from '@/types/workflow';
import {Icon} from './Icons';
import {Tooltip} from './Tooltip';
import CircularToggle from './CircularToggle';
import {useState, useCallback, useEffect} from 'react';
import {usePipeline} from '@/contexts/PipelineContext';

const nodeIcons = {
    // Nodes (Environments)
    node_dev: 'devenvironment',
    node_qa: 'qaenvironment',
    node_prod: 'prodenvironment',

    // Plan
    plan_jira: 'jira',
    plan_trello: 'trello',
    plan_asana: 'asana',

    // Code (Version Control)
    code_github: 'github',
    code_gitlab: 'gitlab',
    code_bitbucket: 'bitbucket',
    code_svn: 'svn',
    code_mercurial: 'mercurial',
    code_perforce: 'perforce',

    // Build (CI/CD)
    build_jenkins: 'jenkins',
    build_github_actions: 'github',
    build_azure_pipelines: 'azure',
    build_circleci: 'circleci',
    build_travis: 'travis',
    build_gitlab_ci: 'gitlab',
    build_teamcity: 'teamcity',
    build_bamboo: 'jenkins', // Using jenkins as fallback for Bamboo

    // Test
    test_jest: 'jest',
    test_selenium: 'selenium',
    test_cypress: 'cypress',
    test_mocha: 'mocha',
    test_playwright: 'playwright',
    test_testng: 'testng',
    test_puppeteer: 'cypress', // Using cypress as fallback for Puppeteer

    // Deploy
    deploy_kubernetes: 'kubernetes',
    deploy_helm: 'helm',
    deploy_aws: 'aws',
    deploy_docker: 'docker',
    deploy_ansible: 'ansible',
    deploy_terraform: 'terraform',
    deploy_gcp: 'gcp',
    deploy_azure: 'azure',

    // Monitor
    monitor_prometheus: 'prometheus',
    monitor_grafana: 'grafana',
    monitor_newrelic: 'newrelic',
    monitor_datadog: 'datadog',

    // Notify
    notify_slack: 'slack',
    notify_teams: 'teams',
    notify_discord: 'discord',
    notify_email: 'slack', // Using slack as fallback for Email
    notify_pagerduty: 'pagerduty',
    notify_webhook: 'slack', // Using slack as fallback for Webhook

    // Approval
    approval_manual: 'manualapproval',
    approval_slack: 'slack',
    approval_teams: 'teams',

    // Release
    release_docker: 'docker',
    release_npm: 'npm',
    release_maven: 'maven',
};

export default function WorkflowNode({
    data,
    selected,
    id,
}: NodeProps<WorkflowNodeData>) {
    const iconName = nodeIcons[data.type] || 'git';
    const [toggleOpen, setToggleOpen] = useState(false);
    const {pipelineConfig, updateNodeConfig, savePipelineConfig} =
        usePipeline();

    // Default configuration for circular toggle
    const defaultConfig: CircularToggleConfig = {
        success: {
            message: 'Pipeline completed successfully!',
            enabled: true,
            notifications: {
                email: true,
                slack: false,
            },
        },
        warning: {
            message: 'Pipeline completed with warnings',
            enabled: true,
            notifications: {
                email: true,
                slack: true,
            },
        },
        failure: {
            message: 'Pipeline failed - check logs for details',
            enabled: true,
            notifications: {
                email: true,
                slack: true,
            },
            actions: {
                rollback: false,
                retrigger: true,
                notify: true,
            },
        },
    };

    // Get configuration from context or use default
    const nodeConfig =
        pipelineConfig[id || ''] || data.circularToggleConfig || defaultConfig;
    const [circularConfig, setCircularConfig] =
        useState<CircularToggleConfig>(nodeConfig);

    // Update local state when context changes
    useEffect(() => {
        const contextConfig = pipelineConfig[id || ''];
        if (contextConfig) {
            setCircularConfig(contextConfig);
        }
    }, [pipelineConfig, id]);

    // Check if this is a GitHub node that should show the toggle
    const shouldShowToggle =
        data.type === 'code_github' || data.showCircularToggle;

    // Create concise tooltip content
    const getStatusText = () => {
        switch (data.status) {
            case 'running':
                return 'Running';
            case 'completed':
                return 'Done';
            case 'failed':
                return 'Failed';
            case 'pending':
            default:
                return 'Pending';
        }
    };

    const tooltipContent = data.status
        ? `${data.label}\n${getStatusText()}${
              data.duration ? ` (${data.duration})` : ''
          }`
        : data.label;

    const handleConfigChange = useCallback(
        (newConfig: CircularToggleConfig) => {
            setCircularConfig(newConfig);
            // Update the context immediately for auto-save
            if (id) {
                updateNodeConfig(id, newConfig);
            }
            // Also update the data with the new configuration
            data.circularToggleConfig = newConfig;
        },
        [data, id, updateNodeConfig],
    );

    const handleConfigSave = useCallback(
        async (config: CircularToggleConfig) => {
            try {
                // Save to backend via context
                if (id) {
                    updateNodeConfig(id, config);
                }

                // Update node data
                data.circularToggleConfig = config;

                // Save the entire pipeline configuration
                await savePipelineConfig({
                    ...pipelineConfig,
                    [id || '']: config,
                });

                console.log('Circular toggle configuration saved successfully');
            } catch (error) {
                console.error('Failed to save configuration:', error);
            }
        },
        [data, id, updateNodeConfig, savePipelineConfig, pipelineConfig],
    );

    return (
        <div className='relative group'>
            <Handle
                type='target'
                position={Position.Top}
                className='w-1.5 h-1.5 !bg-blue-500 !border !border-white !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                style={{
                    top: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
            />

            <Tooltip content={tooltipContent} position='auto'>
                {/* Minimal Icon Node - SVG Only */}
                <div
                    className={`w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer ${
                        selected ? 'scale-105' : ''
                    }`}
                >
                    <Icon name={iconName} size={32} />

                    {/* Status Indicator */}
                    {data.status && (
                        <div
                            className={`absolute top-0 right-0 w-3 h-3 rounded-full border border-white shadow-sm ${
                                data.status === 'pending'
                                    ? 'bg-gray-400'
                                    : data.status === 'running'
                                    ? 'bg-blue-500'
                                    : data.status === 'completed'
                                    ? 'bg-green-500'
                                    : data.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                            }`}
                        >
                            {data.status === 'running' && (
                                <div className='w-full h-full rounded-full bg-blue-400 animate-ping absolute inset-0'></div>
                            )}
                            {data.status === 'completed' && (
                                <svg
                                    className='w-2 h-2 text-white absolute inset-0.5'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            )}
                            {data.status === 'failed' && (
                                <svg
                                    className='w-2 h-2 text-white absolute inset-0.5'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            )}
                        </div>
                    )}
                </div>
            </Tooltip>

            {/* Circular Toggle Component - Positioned to the right of SVG */}
            {shouldShowToggle && (
                <div className='absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2'>
                    <CircularToggle
                        isOpen={toggleOpen}
                        onToggle={() => setToggleOpen(!toggleOpen)}
                        config={circularConfig}
                        onConfigChange={handleConfigChange}
                        onSave={handleConfigSave}
                        position={{x: 8, y: 0}}
                    />
                </div>
            )}

            <Handle
                type='source'
                position={Position.Bottom}
                className='w-1.5 h-1.5 !bg-blue-500 !border !border-white !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                style={{
                    bottom: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
            />
        </div>
    );
}
