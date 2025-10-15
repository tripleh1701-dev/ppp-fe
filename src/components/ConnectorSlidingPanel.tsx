'use client';

import React, {useState, useRef, useCallback, useEffect} from 'react';
import {WorkflowNodeType} from '@/types/workflow';
import {Icon} from './Icons';
import {CATEGORY_TOOLS, TOOLS_CONFIG} from '@/config/toolsConfig';

// CSS animations for connector panel with immediate effects
const animationStyles = `
  /* Tooltip Styles */
  .tooltip-trigger {
    position: relative;
  }

  .tooltip-trigger {
    position: relative;
    z-index: 100;
  }

  .tooltip-trigger::before {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    margin-left: -2px;
    width: 8px;
    height: 8px;
    background-color: rgba(17, 24, 39, 0.95);
    opacity: 0;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100001;
  }

  .tooltip-trigger::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.5rem 0.75rem;
    background-color: rgba(17, 24, 39, 0.95);
    color: white;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100000;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform-origin: left;
    transform: translateY(-50%) translateX(-10px);
    margin-left: 0.75rem;
  }

  .tooltip-trigger:hover::before {
    opacity: 1;
  }

  .tooltip-trigger:hover::after {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
  /* Animations removed for cleaner UI */

  /* Simplified hover effects */
  .connector-card {
    transition: all 0.2s ease-in-out;
  }

  .connector-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .category-card {
    transition: all 0.2s ease-in-out;
  }

  .category-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  /* Staggered animation delays removed */
`;

// Connector categories with their respective connectors
const CONNECTOR_CATEGORIES = {
    showAll: {
        name: 'Show All',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path
                    d='M16 7H8C6.9 7 6 7.9 6 9V15C6 16.1 6.9 17 8 17H16C17.1 17 18 16.1 18 15V9C18 7.9 17.1 7 16 7Z'
                    opacity='0.3'
                >
                    <animate
                        attributeName='opacity'
                        values='0.3;0.6;0.3'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </path>
                <rect
                    x='6'
                    y='7'
                    width='12'
                    height='10'
                    rx='2'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <circle cx='9' cy='10' r='1' fill='currentColor'>
                    <animate
                        attributeName='fill-opacity'
                        values='0.5;1;0.5'
                        dur='1.5s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='15' cy='10' r='1' fill='currentColor'>
                    <animate
                        attributeName='fill-opacity'
                        values='0.5;1;0.5'
                        dur='1.8s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='9' cy='14' r='1' fill='currentColor'>
                    <animate
                        attributeName='fill-opacity'
                        values='0.5;1;0.5'
                        dur='2.2s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='15' cy='14' r='1' fill='currentColor'>
                    <animate
                        attributeName='fill-opacity'
                        values='0.5;1;0.5'
                        dur='1.3s'
                        repeatCount='indefinite'
                    />
                </circle>
                <path
                    d='M2 12H6M18 12H22'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                >
                    <animate
                        attributeName='stroke-dasharray'
                        values='0 4;2 2;4 0;2 2;0 4'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </path>
            </svg>
        ),
        connectors: [],
    },
    node: {
        name: 'Node',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='16'
                    rx='2'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='4'
                    rx='2'
                    fill='currentColor'
                    opacity='0.2'
                />
                <rect
                    x='5'
                    y='10'
                    width='14'
                    height='2'
                    rx='1'
                    fill='currentColor'
                    opacity='0.6'
                >
                    <animate
                        attributeName='opacity'
                        values='0.6;1;0.6'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </rect>
                <rect
                    x='5'
                    y='13'
                    width='10'
                    height='2'
                    rx='1'
                    fill='currentColor'
                    opacity='0.4'
                >
                    <animate
                        attributeName='opacity'
                        values='0.4;0.8;0.4'
                        dur='2.5s'
                        repeatCount='indefinite'
                    />
                </rect>
                <rect
                    x='5'
                    y='16'
                    width='12'
                    height='2'
                    rx='1'
                    fill='currentColor'
                    opacity='0.5'
                >
                    <animate
                        attributeName='opacity'
                        values='0.5;0.9;0.5'
                        dur='1.8s'
                        repeatCount='indefinite'
                    />
                </rect>
                <circle cx='6' cy='6' r='1' fill='currentColor'>
                    <animate
                        attributeName='fill-opacity'
                        values='0.7;1;0.7'
                        dur='1.5s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='9' cy='6' r='1' fill='currentColor'>
                    <animate
                        attributeName='fill-opacity'
                        values='0.7;1;0.7'
                        dur='1.8s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='12' cy='6' r='1' fill='currentColor'>
                    <animate
                        attributeName='fill-opacity'
                        values='0.7;1;0.7'
                        dur='2.2s'
                        repeatCount='indefinite'
                    />
                </circle>
            </svg>
        ),
        connectors: [
            {
                id: 'node-dev',
                name: 'Dev Environment',
                type: 'node_dev' as WorkflowNodeType,
                icon: <Icon name='devenvironment' className='w-8 h-8' />,
            },
            {
                id: 'node-qa',
                name: 'QA Environment',
                type: 'node_qa' as WorkflowNodeType,
                icon: <Icon name='qaenvironment' className='w-8 h-8' />,
            },
            {
                id: 'node-prod',
                name: 'Production Environment',
                type: 'node_prod' as WorkflowNodeType,
                icon: <Icon name='prodenvironment' className='w-8 h-8' />,
            },
        ],
    },
    plan: {
        name: 'Plan',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='16'
                    rx='2'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='5'
                    rx='2'
                    fill='currentColor'
                    opacity='0.2'
                />
                <path
                    d='M7 2V6M17 2V6'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <rect
                    x='6'
                    y='11'
                    width='3'
                    height='2'
                    rx='0.5'
                    fill='currentColor'
                    opacity='0.6'
                >
                    <animate
                        attributeName='opacity'
                        values='0.6;1;0.6'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </rect>
                <rect
                    x='10.5'
                    y='11'
                    width='3'
                    height='2'
                    rx='0.5'
                    fill='currentColor'
                    opacity='0.4'
                >
                    <animate
                        attributeName='opacity'
                        values='0.4;0.8;0.4'
                        dur='2.5s'
                        repeatCount='indefinite'
                    />
                </rect>
                <rect
                    x='15'
                    y='11'
                    width='3'
                    height='2'
                    rx='0.5'
                    fill='currentColor'
                    opacity='0.5'
                >
                    <animate
                        attributeName='opacity'
                        values='0.5;0.9;0.5'
                        dur='1.8s'
                        repeatCount='indefinite'
                    />
                </rect>
                <rect
                    x='6'
                    y='14.5'
                    width='3'
                    height='2'
                    rx='0.5'
                    fill='currentColor'
                    opacity='0.3'
                >
                    <animate
                        attributeName='opacity'
                        values='0.3;0.7;0.3'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </rect>
                <rect
                    x='10.5'
                    y='14.5'
                    width='3'
                    height='2'
                    rx='0.5'
                    fill='currentColor'
                    opacity='0.7'
                >
                    <animate
                        attributeName='opacity'
                        values='0.7;1;0.7'
                        dur='1.5s'
                        repeatCount='indefinite'
                    />
                </rect>
                <circle
                    cx='16.5'
                    cy='15.5'
                    r='1.5'
                    fill='#ef4444'
                    opacity='0.8'
                >
                    <animate
                        attributeName='opacity'
                        values='0.8;1;0.8'
                        dur='1s'
                        repeatCount='indefinite'
                    />
                </circle>
                <path
                    d='M15.5 15.5L17.5 15.5'
                    stroke='white'
                    strokeWidth='1'
                    strokeLinecap='round'
                />
                <path
                    d='M16.5 14.5L16.5 16.5'
                    stroke='white'
                    strokeWidth='1'
                    strokeLinecap='round'
                />
            </svg>
        ),
        connectors: [
            {
                id: 'plan-jira',
                name: 'Jira',
                type: 'plan_jira' as WorkflowNodeType,
                icon: <Icon name='jira' className='w-8 h-8' />,
            },
            {
                id: 'plan-azure-devops',
                name: 'Azure DevOps',
                type: 'plan_azure_devops' as WorkflowNodeType,
                icon: <Icon name='azdo' className='w-8 h-8' />,
            },
            {
                id: 'plan-trello',
                name: 'Trello',
                type: 'plan_trello' as WorkflowNodeType,
                icon: <Icon name='trello' className='w-8 h-8' />,
            },
            {
                id: 'plan-asana',
                name: 'Asana',
                type: 'plan_asana' as WorkflowNodeType,
                icon: <Icon name='asana' className='w-8 h-8' />,
            },
        ],
    },
    code: {
        name: 'Code',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <rect
                    x='2'
                    y='3'
                    width='20'
                    height='18'
                    rx='2'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <rect
                    x='2'
                    y='3'
                    width='20'
                    height='6'
                    rx='2'
                    fill='currentColor'
                    opacity='0.2'
                />
                <circle cx='6' cy='6' r='1' fill='currentColor' />
                <circle cx='9' cy='6' r='1' fill='currentColor' />
                <circle cx='12' cy='6' r='1' fill='currentColor' />
                <path
                    d='M8 14l2-2-2-2'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <animate
                        attributeName='opacity'
                        values='0.7;1;0.7'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </path>
                <path
                    d='M12 14h4'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                />
                <path
                    d='M7 17h10'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    opacity='0.5'
                />
            </svg>
        ),
        connectors: [
            {
                id: 'code-github',
                name: 'GitHub',
                type: 'code_github' as WorkflowNodeType,
                icon: <Icon name='github' className='w-8 h-8' />,
            },
            {
                id: 'code-gitlab',
                name: 'GitLab',
                type: 'code_gitlab' as WorkflowNodeType,
                icon: <Icon name='gitlab' className='w-8 h-8' />,
            },
            {
                id: 'code-azure-repos',
                name: 'Azure Repos',
                type: 'code_azure_repos' as WorkflowNodeType,
                icon: <Icon name='azure' className='w-8 h-8' />,
            },
            {
                id: 'code-bitbucket',
                name: 'Bitbucket',
                type: 'code_bitbucket' as WorkflowNodeType,
                icon: <Icon name='bitbucket' className='w-8 h-8' />,
            },
            {
                id: 'code-sonarqube',
                name: 'SonarQube',
                type: 'code_sonarqube' as WorkflowNodeType,
                icon: <Icon name='sonarqube' className='w-8 h-8' />,
            },
        ],
    },
    build: {
        name: 'Build',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.5 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.5 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.22 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.94C7.96 18.34 8.52 18.68 9.13 18.93L9.5 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.5 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.94L19.05 18.95C19.27 19.03 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z'>
                    <animateTransform
                        attributeName='transform'
                        attributeType='XML'
                        type='rotate'
                        from='0 12 12'
                        to='360 12 12'
                        dur='4s'
                        repeatCount='indefinite'
                    />
                </path>
            </svg>
        ),
        connectors: [
            {
                id: 'build-jenkins',
                name: 'Jenkins',
                type: 'build_jenkins' as WorkflowNodeType,
                icon: <Icon name='jenkins' className='w-8 h-8' />,
            },
            {
                id: 'build-github-actions',
                name: 'GitHub Actions',
                type: 'build_github_actions' as WorkflowNodeType,
                icon: <Icon name='github' className='w-8 h-8' />,
            },
            {
                id: 'build-circleci',
                name: 'CircleCI',
                type: 'build_circleci' as WorkflowNodeType,
                icon: <Icon name='circleci' className='w-8 h-8' />,
            },
            {
                id: 'build-aws-codebuild',
                name: 'AWS CodeBuild',
                type: 'build_aws_codebuild' as WorkflowNodeType,
                icon: <Icon name='aws' className='w-8 h-8' />,
            },
            {
                id: 'build-google-cloud-build',
                name: 'Google Cloud Build',
                type: 'build_google_cloud_build' as WorkflowNodeType,
                icon: <Icon name='cloudbuild' className='w-8 h-8' />,
            },
            {
                id: 'build-azure-devops',
                name: 'Azure DevOps',
                type: 'build_azure_devops' as WorkflowNodeType,
                icon: <Icon name='azdo' className='w-8 h-8' />,
            },
        ],
    },
    test: {
        name: 'Test',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path
                    d='M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z'
                    opacity='0.2'
                />
                <path
                    d='M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19Z'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <path
                    d='M7 12L10 15L17 8'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                >
                    <animate
                        attributeName='stroke-dasharray'
                        values='0 24;12 12;24 0;12 12;0 24'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </path>
                <circle cx='7' cy='8' r='1' fill='currentColor' opacity='0.6'>
                    <animate
                        attributeName='opacity'
                        values='0.6;1;0.6'
                        dur='1s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='7' cy='11' r='1' fill='currentColor' opacity='0.8'>
                    <animate
                        attributeName='opacity'
                        values='0.8;1;0.8'
                        dur='1.2s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='7' cy='14' r='1' fill='currentColor' opacity='0.7'>
                    <animate
                        attributeName='opacity'
                        values='0.7;1;0.7'
                        dur='0.8s'
                        repeatCount='indefinite'
                    />
                </circle>
            </svg>
        ),
        connectors: [
            {
                id: 'test-cypress',
                name: 'Cypress',
                type: 'test_cypress' as WorkflowNodeType,
                icon: <Icon name='cypress' className='w-8 h-8' />,
            },
            {
                id: 'test-selenium',
                name: 'Selenium',
                type: 'test_selenium' as WorkflowNodeType,
                icon: <Icon name='selenium' className='w-8 h-8' />,
            },
            {
                id: 'test-jest',
                name: 'Jest',
                type: 'test_jest' as WorkflowNodeType,
                icon: <Icon name='jest' className='w-8 h-8' />,
            },
            {
                id: 'test-tricentis-tosca',
                name: 'Tricentis Tosca',
                type: 'test_tricentis_tosca' as WorkflowNodeType,
                icon: <Icon name='asana' className='w-8 h-8' />,
            },
        ],
    },
    deploy: {
        name: 'Deploy',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2L2 7L12 12L22 7L12 2Z' opacity='0.3'>
                    <animate
                        attributeName='opacity'
                        values='0.3;0.6;0.3'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </path>
                <path
                    d='M2 17L12 22L22 17'
                    stroke='currentColor'
                    strokeWidth='2'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <animate
                        attributeName='stroke-dasharray'
                        values='0 40;20 20;40 0;20 20;0 40'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </path>
                <path
                    d='M2 12L12 17L22 12'
                    stroke='currentColor'
                    strokeWidth='2'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <animate
                        attributeName='stroke-dasharray'
                        values='0 40;20 20;40 0;20 20;0 40'
                        dur='2.5s'
                        repeatCount='indefinite'
                    />
                </path>
                <path
                    d='M12 2L2 7L12 12L22 7L12 2Z'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <circle cx='18' cy='6' r='2' fill='#10b981' opacity='0.8'>
                    <animate
                        attributeName='opacity'
                        values='0.8;1;0.8'
                        dur='1.5s'
                        repeatCount='indefinite'
                    />
                </circle>
                <path
                    d='M17 6L18 7L19 5'
                    stroke='white'
                    strokeWidth='1'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                />
                <circle cx='12' cy='17' r='1' fill='currentColor' opacity='0.6'>
                    <animate
                        attributeName='r'
                        values='1;2;1'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='opacity'
                        values='0.6;1;0.6'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </circle>
            </svg>
        ),
        connectors: [
            {
                id: 'deploy-kubernetes',
                name: 'Kubernetes',
                type: 'deploy_kubernetes' as WorkflowNodeType,
                icon: <Icon name='kubernetes' className='w-8 h-8' />,
            },
            {
                id: 'deploy-helm',
                name: 'Helm',
                type: 'deploy_helm' as WorkflowNodeType,
                icon: <Icon name='helm' className='w-8 h-8' />,
            },
            {
                id: 'deploy-terraform',
                name: 'Terraform',
                type: 'deploy_terraform' as WorkflowNodeType,
                icon: <Icon name='terraform' className='w-8 h-8' />,
            },
            {
                id: 'deploy-ansible',
                name: 'Ansible',
                type: 'deploy_ansible' as WorkflowNodeType,
                icon: <Icon name='ansible' className='w-8 h-8' />,
            },
            {
                id: 'deploy-docker',
                name: 'Docker',
                type: 'deploy_docker' as WorkflowNodeType,
                icon: <Icon name='docker' className='w-8 h-8' />,
            },
            {
                id: 'deploy-aws-codepipeline',
                name: 'AWS CodePipeline',
                type: 'deploy_aws_codepipeline' as WorkflowNodeType,
                icon: <Icon name='codepipeline' className='w-8 h-8' />,
            },
            {
                id: 'deploy-cloudfoundry',
                name: 'Cloud Foundry',
                type: 'deploy_cloudfoundry' as WorkflowNodeType,
                icon: <Icon name='cloudfoundry' className='w-8 h-8' />,
            },
        ],
    },
    approval: {
        name: 'Approval',
        icon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <path
                    d='M20 6L9 17l-5-5'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <animate
                        attributeName='stroke-dasharray'
                        values='0 30;15 15;30 0;15 15;0 30'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </path>
                <circle cx='12' cy='12' r='9' strokeWidth='2' opacity='0.3'>
                    <animate
                        attributeName='r'
                        values='9;11;9'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='opacity'
                        values='0.3;0.6;0.3'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='20' cy='6' r='1' fill='currentColor'>
                    <animate
                        attributeName='r'
                        values='1;2;1'
                        dur='1s'
                        repeatCount='indefinite'
                    />
                </circle>
            </svg>
        ),
        connectors: [
            {
                id: 'approval-manual',
                name: 'Manual Approval',
                type: 'approval_manual' as WorkflowNodeType,
                icon: <Icon name='manualapproval' className='w-8 h-8' />,
            },
            {
                id: 'approval-slack',
                name: 'Slack Approval',
                type: 'approval_slack' as WorkflowNodeType,
                icon: <Icon name='slack' className='w-8 h-8' />,
            },
            {
                id: 'approval-teams',
                name: 'Teams Approval',
                type: 'approval_teams' as WorkflowNodeType,
                icon: <Icon name='teams' className='w-8 h-8' />,
            },
        ],
    },
    release: {
        name: 'Release',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <rect
                    x='3'
                    y='6'
                    width='18'
                    height='12'
                    rx='2'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <rect
                    x='3'
                    y='6'
                    width='18'
                    height='4'
                    rx='2'
                    fill='currentColor'
                    opacity='0.2'
                />
                <path d='M12 2L8 6H16L12 2Z' fill='currentColor' opacity='0.6'>
                    <animate
                        attributeName='opacity'
                        values='0.6;1;0.6'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </path>
                <rect
                    x='6'
                    y='12'
                    width='4'
                    height='2'
                    rx='0.5'
                    fill='currentColor'
                    opacity='0.7'
                >
                    <animate
                        attributeName='opacity'
                        values='0.7;1;0.7'
                        dur='1.5s'
                        repeatCount='indefinite'
                    />
                </rect>
                <rect
                    x='11'
                    y='12'
                    width='6'
                    height='2'
                    rx='0.5'
                    fill='currentColor'
                    opacity='0.5'
                >
                    <animate
                        attributeName='opacity'
                        values='0.5;0.9;0.5'
                        dur='2.2s'
                        repeatCount='indefinite'
                    />
                </rect>
                <rect
                    x='6'
                    y='15'
                    width='8'
                    height='2'
                    rx='0.5'
                    fill='currentColor'
                    opacity='0.4'
                >
                    <animate
                        attributeName='opacity'
                        values='0.4;0.8;0.4'
                        dur='1.8s'
                        repeatCount='indefinite'
                    />
                </rect>
                <circle cx='18' cy='8' r='2' fill='#22c55e' opacity='0.9'>
                    <animate
                        attributeName='opacity'
                        values='0.9;1;0.9'
                        dur='1s'
                        repeatCount='indefinite'
                    />
                </circle>
                <path
                    d='M17 8L18 9L19 7'
                    stroke='white'
                    strokeWidth='1'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                />
                <circle cx='6' cy='8' r='1' fill='currentColor' opacity='0.6'>
                    <animate
                        attributeName='opacity'
                        values='0.6;1;0.6'
                        dur='1.3s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='9' cy='8' r='1' fill='currentColor' opacity='0.7'>
                    <animate
                        attributeName='opacity'
                        values='0.7;1;0.7'
                        dur='1.7s'
                        repeatCount='indefinite'
                    />
                </circle>
            </svg>
        ),
        connectors: [
            {
                id: 'release-argo-cd',
                name: 'Argo CD',
                type: 'release_argo_cd' as WorkflowNodeType,
                icon: <Icon name='argo' className='w-8 h-8' />,
            },
            {
                id: 'release-servicenow',
                name: 'ServiceNow',
                type: 'release_servicenow' as WorkflowNodeType,
                icon: <Icon name='slack' className='w-8 h-8' />,
            },
            {
                id: 'release-azure-devops',
                name: 'Azure DevOps',
                type: 'release_azure_devops' as WorkflowNodeType,
                icon: <Icon name='azdo' className='w-8 h-8' />,
            },
        ],
    },
};

// Filter connectors to only show tools from shared CATEGORY_TOOLS configuration
const FILTERED_CONNECTOR_CATEGORIES = Object.entries(
    CONNECTOR_CATEGORIES,
).reduce((acc, [categoryKey, categoryData]) => {
    if (
        categoryKey === 'showAll' ||
        categoryKey === 'node' ||
        categoryKey === 'approval'
    ) {
        // Keep showAll, node, and approval as-is (not in global settings)
        (acc as any)[categoryKey] = categoryData;
        return acc;
    }

    // For other categories, filter connectors based on shared config
    const allowedToolNames =
        CATEGORY_TOOLS[categoryKey as keyof typeof CATEGORY_TOOLS] || [];
    const filteredConnectors = categoryData.connectors.filter((connector) => {
        // Check if connector name is in the allowed tools list (exact match)
        return allowedToolNames.some(
            (toolName) =>
                toolName.toLowerCase() === connector.name.toLowerCase(),
        );
    });

    (acc as any)[categoryKey] = {
        ...categoryData,
        connectors: filteredConnectors,
    };
    return acc;
}, {} as typeof CONNECTOR_CATEGORIES);

interface ConnectorSlidingPanelProps {
    onConnectorSelect: (connectorType: WorkflowNodeType) => void;
    onDragStart: (event: React.DragEvent, nodeType: WorkflowNodeType) => void;
    enabledConnectors?: string[]; // List of enabled connector names from global settings
}

const ConnectorSlidingPanel: React.FC<ConnectorSlidingPanelProps> = ({
    onConnectorSelect,
    onDragStart,
    enabledConnectors = [], // Default to empty array (allow all if not specified)
}) => {
    // Debug: Log enabled connectors
    useEffect(() => {
        console.log(
            '🔧 [ConnectorPanel] Enabled connectors list:',
            enabledConnectors,
        );
        console.log(
            '🔧 [ConnectorPanel] Total enabled:',
            enabledConnectors.length,
        );
    }, [enabledConnectors]);
    const [isHovered, setIsHovered] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null,
    );
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);
    const autoCloseTimerRef = useRef<NodeJS.Timeout>();

    // Function to reset the auto-close timer
    const resetAutoCloseTimer = useCallback(() => {
        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
        }

        if (isPanelExpanded) {
            autoCloseTimerRef.current = setTimeout(() => {
                setIsPanelExpanded(false);
            }, 7000); // 7 seconds
        }
    }, [isPanelExpanded]);

    // Start the timer when panel expands
    useEffect(() => {
        resetAutoCloseTimer();
        return () => {
            if (autoCloseTimerRef.current) {
                clearTimeout(autoCloseTimerRef.current);
            }
        };
    }, [isPanelExpanded, resetAutoCloseTimer]);
    const [searchQuery, setSearchQuery] = useState('');

    const handleCategoryClick = (categoryKey: string) => {
        if (categoryKey === 'showAll') {
            setSelectedCategory(null); // null means show all connectors
            setIsPanelExpanded(true);
        } else {
            setSelectedCategory(categoryKey);
            setIsPanelExpanded(true);
        }
    };

    const getAllConnectors = () => {
        return Object.values(FILTERED_CONNECTOR_CATEGORIES)
            .filter((cat) => cat.name !== 'Show All')
            .flatMap((category) => category.connectors);
    };

    // Categories that should be checked against global settings
    // Categories NOT in this list (like "node") will always be enabled
    const CATEGORIES_IN_GLOBAL_SETTINGS = [
        'plan',
        'code',
        'build',
        'test',
        'deploy',
        'release',
        'approval',
    ];

    // Helper function to get the category of a connector by name
    const getConnectorCategory = (connectorName: string): string | null => {
        for (const [categoryKey, category] of Object.entries(
            FILTERED_CONNECTOR_CATEGORIES,
        )) {
            if (categoryKey === 'showAll') continue;
            if (category.connectors.some((c) => c.name === connectorName)) {
                return categoryKey;
            }
        }
        return null;
    };

    // Helper function to check if a connector is enabled based on global settings
    const isConnectorEnabled = (connectorName: string) => {
        // Get the category this connector belongs to
        const category = getConnectorCategory(connectorName);

        // If category is not in global settings (like "node"), always enable
        if (
            category &&
            !CATEGORIES_IN_GLOBAL_SETTINGS.includes(category.toLowerCase())
        ) {
            return true;
        }

        // If no enabledConnectors list provided (empty array), allow all connectors
        if (enabledConnectors.length === 0) {
            return true; // Allow all if no restrictions
        }

        // Check if connector name is in the enabled list (case insensitive)
        const isEnabled = enabledConnectors.some(
            (enabled) => enabled.toLowerCase() === connectorName.toLowerCase(),
        );
        return isEnabled;
    };

    const getDisplayedConnectors = () => {
        let connectors;
        if (selectedCategory && selectedCategory !== 'showAll') {
            connectors =
                FILTERED_CONNECTOR_CATEGORIES[
                    selectedCategory as keyof typeof FILTERED_CONNECTOR_CATEGORIES
                ]?.connectors || [];
        } else {
            // When selectedCategory is null (Show All clicked), return all connectors
            connectors = getAllConnectors();
        }

        // Filter by search query (case insensitive)
        if (searchQuery.trim()) {
            connectors = connectors.filter((connector) =>
                connector.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
            );
        }

        return connectors;
    };

    const isShowingAll = selectedCategory === null;

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: animationStyles}} />
            <div
                className={`relative h-full flex transition-all duration-300 ease-in-out shadow-lg ${
                    isPanelExpanded
                        ? 'w-[342px]' // Blue bar (48px) + Expanded content (294px) - 10% reduced width
                        : 'w-12' // Just the blue bar
                }`}
                onMouseMove={resetAutoCloseTimer}
                onMouseDown={resetAutoCloseTimer}
                onClick={resetAutoCloseTimer}
                style={{}}
            >
                {/* Blue Bar Section (always visible) */}
                <div
                    className='w-[48px] h-full flex flex-col items-center justify-center py-6 gap-8 flex-shrink-0'
                    style={{
                        backgroundColor: '#0a1a2f',
                        backgroundImage: 'url(/images/logos/sidebar.png)',
                        backgroundSize: 'contain',
                        backgroundPosition: 'center bottom',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Show All Button */}
                    <div
                        className='w-8 h-8 mb-3 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                        data-tooltip='Show All Connectors'
                        onClick={() => handleCategoryClick('showAll')}
                    >
                        <div className='group-hover:drop-shadow-lg'>
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
                                    d='M4 6h16M4 10h16M4 14h16M4 18h16'
                                />
                            </svg>
                        </div>
                        {/* Sliding Tooltip */}
                        <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                            Show All Connectors
                        </div>
                    </div>

                    {/* First Separator */}
                    <div className='w-8 h-px bg-white/30 mb-3'></div>

                    {/* Category Icons Stack */}
                    <div className='flex flex-col space-y-5 mb-3 relative'>
                        {/* Node */}
                        <div
                            className='w-8 h-8 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                            onClick={() => handleCategoryClick('node')}
                            data-tooltip='Node Environment'
                        >
                            <div className='group-hover:drop-shadow-lg'>
                                {React.cloneElement(
                                    CONNECTOR_CATEGORIES.node
                                        .icon as React.ReactElement,
                                    {
                                        className: 'w-6 h-6',
                                        style: {
                                            width: '24px',
                                            height: '24px',
                                        },
                                    },
                                )}
                            </div>
                            {/* Sliding Tooltip */}
                            <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                                Node
                            </div>
                        </div>

                        {/* Plan */}
                        <div
                            className='w-8 h-8 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                            onClick={() => handleCategoryClick('plan')}
                            data-tooltip='Plan'
                        >
                            <div className='group-hover:drop-shadow-lg'>
                                {React.cloneElement(
                                    CONNECTOR_CATEGORIES.plan
                                        .icon as React.ReactElement,
                                    {
                                        className: 'w-6 h-6',
                                        style: {
                                            width: '24px',
                                            height: '24px',
                                        },
                                    },
                                )}
                            </div>
                            {/* Sliding Tooltip */}
                            <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                                Plan
                            </div>
                        </div>

                        {/* Code */}
                        <div
                            className='w-8 h-8 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                            onClick={() => handleCategoryClick('code')}
                            data-tooltip='Code'
                        >
                            <div className='group-hover:drop-shadow-lg'>
                                {React.cloneElement(
                                    CONNECTOR_CATEGORIES.code
                                        .icon as React.ReactElement,
                                    {
                                        className: 'w-6 h-6',
                                        style: {
                                            width: '24px',
                                            height: '24px',
                                        },
                                    },
                                )}
                            </div>
                            {/* Sliding Tooltip */}
                            <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                                Code
                            </div>
                        </div>

                        {/* Build */}
                        <div
                            className='w-8 h-8 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                            onClick={() => handleCategoryClick('build')}
                            data-tooltip='Build'
                        >
                            <div className='group-hover:drop-shadow-lg'>
                                {React.cloneElement(
                                    CONNECTOR_CATEGORIES.build
                                        .icon as React.ReactElement,
                                    {
                                        className: 'w-6 h-6',
                                        style: {
                                            width: '24px',
                                            height: '24px',
                                        },
                                    },
                                )}
                            </div>
                            {/* Sliding Tooltip */}
                            <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                                Build
                            </div>
                        </div>

                        {/* Test */}
                        <div
                            className='w-8 h-8 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                            onClick={() => handleCategoryClick('test')}
                            data-tooltip='Test'
                        >
                            <div className='group-hover:drop-shadow-lg'>
                                {React.cloneElement(
                                    CONNECTOR_CATEGORIES.test
                                        .icon as React.ReactElement,
                                    {
                                        className: 'w-6 h-6',
                                        style: {
                                            width: '24px',
                                            height: '24px',
                                        },
                                    },
                                )}
                            </div>
                            {/* Sliding Tooltip */}
                            <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                                Test
                            </div>
                        </div>

                        {/* Deploy */}
                        <div
                            className='w-8 h-8 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                            onClick={() => handleCategoryClick('deploy')}
                            data-tooltip='Deploy'
                        >
                            <div className='group-hover:drop-shadow-lg'>
                                {React.cloneElement(
                                    CONNECTOR_CATEGORIES.deploy
                                        .icon as React.ReactElement,
                                    {
                                        className: 'w-6 h-6',
                                        style: {
                                            width: '24px',
                                            height: '24px',
                                        },
                                    },
                                )}
                            </div>
                            {/* Sliding Tooltip */}
                            <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                                Deploy
                            </div>
                        </div>

                        {/* Approval */}
                        <div
                            className='w-8 h-8 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                            onClick={() => handleCategoryClick('approval')}
                            data-tooltip='Approval'
                        >
                            <div className='group-hover:drop-shadow-lg'>
                                {React.cloneElement(
                                    CONNECTOR_CATEGORIES.approval
                                        .icon as React.ReactElement,
                                    {
                                        className: 'w-6 h-6',
                                        style: {
                                            width: '24px',
                                            height: '24px',
                                        },
                                    },
                                )}
                            </div>
                            {/* Sliding Tooltip */}
                            <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                                Approval
                            </div>
                        </div>

                        {/* Release */}
                        <div
                            className='w-8 h-8 text-white/70 hover:text-white transition-all duration-300 cursor-pointer group relative flex items-center justify-center tooltip-trigger'
                            onClick={() => handleCategoryClick('release')}
                            data-tooltip='Release'
                        >
                            <div className='group-hover:drop-shadow-lg'>
                                {React.cloneElement(
                                    CONNECTOR_CATEGORIES.release
                                        .icon as React.ReactElement,
                                    {
                                        className: 'w-6 h-6',
                                        style: {
                                            width: '24px',
                                            height: '24px',
                                        },
                                    },
                                )}
                            </div>
                            {/* Sliding Tooltip */}
                            <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50'>
                                Release
                            </div>
                        </div>
                    </div>

                    {/* Second Separator */}
                    <div className='w-8 h-px bg-white/30 mb-auto'></div>

                    {/* Connector Name (Vertically Aligned) */}
                    <div className='text-white/90 text-sm font-bold transform -rotate-90 whitespace-nowrap flex items-center gap-1 group-hover:scale-105 transition-transform duration-200 mb-12'>
                        <svg
                            className='w-3 h-3 transform rotate-90'
                            fill='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <defs>
                                <linearGradient
                                    id='connectorGradient'
                                    x1='0%'
                                    y1='0%'
                                    x2='100%'
                                    y2='100%'
                                >
                                    <stop
                                        offset='0%'
                                        stopColor='currentColor'
                                        stopOpacity='0.8'
                                    />
                                    <stop
                                        offset='100%'
                                        stopColor='currentColor'
                                        stopOpacity='0.4'
                                    />
                                </linearGradient>
                            </defs>
                            <rect
                                x='7'
                                y='6'
                                width='10'
                                height='12'
                                rx='2'
                                fill='url(#connectorGradient)'
                                stroke='currentColor'
                                strokeWidth='1'
                            >
                                <animate
                                    attributeName='fill-opacity'
                                    values='0.8;1;0.8'
                                    dur='3s'
                                    repeatCount='indefinite'
                                />
                            </rect>
                            <circle cx='9' cy='9' r='1.5' fill='currentColor'>
                                <animate
                                    attributeName='fill-opacity'
                                    values='0.5;1;0.5'
                                    dur='1.2s'
                                    repeatCount='indefinite'
                                />
                            </circle>
                            <circle cx='15' cy='9' r='1.5' fill='currentColor'>
                                <animate
                                    attributeName='fill-opacity'
                                    values='0.5;1;0.5'
                                    dur='1.5s'
                                    repeatCount='indefinite'
                                />
                            </circle>
                            <circle cx='9' cy='12' r='1.5' fill='currentColor'>
                                <animate
                                    attributeName='fill-opacity'
                                    values='0.5;1;0.5'
                                    dur='1.8s'
                                    repeatCount='indefinite'
                                />
                            </circle>
                            <circle cx='15' cy='12' r='1.5' fill='currentColor'>
                                <animate
                                    attributeName='fill-opacity'
                                    values='0.5;1;0.5'
                                    dur='2.1s'
                                    repeatCount='indefinite'
                                />
                            </circle>
                            <circle cx='9' cy='15' r='1.5' fill='currentColor'>
                                <animate
                                    attributeName='fill-opacity'
                                    values='0.5;1;0.5'
                                    dur='1.7s'
                                    repeatCount='indefinite'
                                />
                            </circle>
                            <circle cx='15' cy='15' r='1.5' fill='currentColor'>
                                <animate
                                    attributeName='fill-opacity'
                                    values='0.5;1;0.5'
                                    dur='1.3s'
                                    repeatCount='indefinite'
                                />
                            </circle>
                            <path
                                d='M2 12H7M17 12H22'
                                stroke='currentColor'
                                strokeWidth='2.5'
                                strokeLinecap='round'
                            >
                                <animate
                                    attributeName='stroke-dasharray'
                                    values='0 10;5 5;10 0;5 5;0 10'
                                    dur='4s'
                                    repeatCount='indefinite'
                                />
                                <animate
                                    attributeName='opacity'
                                    values='0.6;1;0.6'
                                    dur='2s'
                                    repeatCount='indefinite'
                                />
                            </path>
                            <circle cx='3' cy='12' r='1' fill='currentColor'>
                                <animate
                                    attributeName='r'
                                    values='1;2;1'
                                    dur='2s'
                                    repeatCount='indefinite'
                                />
                                <animate
                                    attributeName='opacity'
                                    values='0.7;1;0.7'
                                    dur='2s'
                                    repeatCount='indefinite'
                                />
                            </circle>
                            <circle cx='21' cy='12' r='1' fill='currentColor'>
                                <animate
                                    attributeName='r'
                                    values='1;2;1'
                                    dur='2.5s'
                                    repeatCount='indefinite'
                                />
                                <animate
                                    attributeName='opacity'
                                    values='0.7;1;0.7'
                                    dur='2.5s'
                                    repeatCount='indefinite'
                                />
                            </circle>
                        </svg>
                        Connectors
                    </div>
                </div>

                {/* White Section - Connectors (visible when expanded) */}
                {isPanelExpanded && (
                    <div className='bg-white shadow-lg w-[294px] flex flex-col h-full'>
                        <div className='p-3 h-full flex flex-col'>
                            {/* Header with Close Button */}
                            <div className='flex items-center justify-between mb-3'>
                                <h4 className='text-base font-semibold text-gray-800 flex items-center gap-2'>
                                    <svg
                                        className='w-4 h-4 text-primary-600'
                                        fill='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <defs>
                                            <linearGradient
                                                id='connectorGradient3'
                                                x1='0%'
                                                y1='0%'
                                                x2='100%'
                                                y2='100%'
                                            >
                                                <stop
                                                    offset='0%'
                                                    stopColor='currentColor'
                                                    stopOpacity='0.8'
                                                />
                                                <stop
                                                    offset='100%'
                                                    stopColor='currentColor'
                                                    stopOpacity='0.4'
                                                />
                                            </linearGradient>
                                        </defs>
                                        <rect
                                            x='7'
                                            y='6'
                                            width='10'
                                            height='12'
                                            rx='2'
                                            fill='url(#connectorGradient3)'
                                            stroke='currentColor'
                                            strokeWidth='1'
                                        >
                                            <animate
                                                attributeName='fill-opacity'
                                                values='0.8;1;0.8'
                                                dur='3s'
                                                repeatCount='indefinite'
                                            />
                                        </rect>
                                        <circle
                                            cx='9'
                                            cy='9'
                                            r='1.5'
                                            fill='currentColor'
                                        >
                                            <animate
                                                attributeName='fill-opacity'
                                                values='0.5;1;0.5'
                                                dur='1.2s'
                                                repeatCount='indefinite'
                                            />
                                        </circle>
                                        <circle
                                            cx='15'
                                            cy='9'
                                            r='1.5'
                                            fill='currentColor'
                                        >
                                            <animate
                                                attributeName='fill-opacity'
                                                values='0.5;1;0.5'
                                                dur='1.5s'
                                                repeatCount='indefinite'
                                            />
                                        </circle>
                                        <circle
                                            cx='9'
                                            cy='12'
                                            r='1.5'
                                            fill='currentColor'
                                        >
                                            <animate
                                                attributeName='fill-opacity'
                                                values='0.5;1;0.5'
                                                dur='1.8s'
                                                repeatCount='indefinite'
                                            />
                                        </circle>
                                        <circle
                                            cx='15'
                                            cy='12'
                                            r='1.5'
                                            fill='currentColor'
                                        >
                                            <animate
                                                attributeName='fill-opacity'
                                                values='0.5;1;0.5'
                                                dur='2.1s'
                                                repeatCount='indefinite'
                                            />
                                        </circle>
                                        <circle
                                            cx='9'
                                            cy='15'
                                            r='1.5'
                                            fill='currentColor'
                                        >
                                            <animate
                                                attributeName='fill-opacity'
                                                values='0.5;1;0.5'
                                                dur='1.7s'
                                                repeatCount='indefinite'
                                            />
                                        </circle>
                                        <circle
                                            cx='15'
                                            cy='15'
                                            r='1.5'
                                            fill='currentColor'
                                        >
                                            <animate
                                                attributeName='fill-opacity'
                                                values='0.5;1;0.5'
                                                dur='1.3s'
                                                repeatCount='indefinite'
                                            />
                                        </circle>
                                        <path
                                            d='M2 12H7M17 12H22'
                                            stroke='currentColor'
                                            strokeWidth='2.5'
                                            strokeLinecap='round'
                                        >
                                            <animate
                                                attributeName='stroke-dasharray'
                                                values='0 10;5 5;10 0;5 5;0 10'
                                                dur='4s'
                                                repeatCount='indefinite'
                                            />
                                            <animate
                                                attributeName='opacity'
                                                values='0.6;1;0.6'
                                                dur='2s'
                                                repeatCount='indefinite'
                                            />
                                        </path>
                                    </svg>
                                    {selectedCategory &&
                                    selectedCategory !== 'showAll'
                                        ? FILTERED_CONNECTOR_CATEGORIES[
                                              selectedCategory as keyof typeof FILTERED_CONNECTOR_CATEGORIES
                                          ]?.name + ' Connectors'
                                        : 'Connectors'}
                                </h4>

                                {/* Close Button */}
                                <button
                                    onClick={() => setIsPanelExpanded(false)}
                                    className='p-1 hover:bg-gray-100 rounded transition-colors duration-200 flex items-center justify-center'
                                    title='Close'
                                >
                                    <svg
                                        className='w-5 h-5 text-gray-500 hover:text-gray-700'
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

                            {/* Search Bar (for all categories) */}
                            {isPanelExpanded && (
                                <div className='relative mb-3'>
                                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                        <svg
                                            className='h-4 w-4 text-gray-400'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
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
                                        placeholder='Search connectors...'
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className='block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm'
                                    />
                                    {searchQuery && (
                                        <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    setSearchQuery('')
                                                }
                                                className='h-4 w-4 text-gray-400 hover:text-gray-600'
                                            >
                                                <svg
                                                    fill='none'
                                                    viewBox='0 0 24 24'
                                                    stroke='currentColor'
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
                                    )}
                                </div>
                            )}

                            <div className='flex-1 overflow-y-auto'>
                                {isShowingAll ? (
                                    // Show All: Display with category separators
                                    Object.entries(
                                        FILTERED_CONNECTOR_CATEGORIES,
                                    )
                                        .filter(([key]) => key !== 'showAll')
                                        .map(([key, category]) => {
                                            // Filter connectors by search query (case insensitive)
                                            const filteredConnectors =
                                                searchQuery.trim()
                                                    ? category.connectors.filter(
                                                          (connector) =>
                                                              connector.name
                                                                  .toLowerCase()
                                                                  .includes(
                                                                      searchQuery.toLowerCase(),
                                                                  ),
                                                      )
                                                    : category.connectors;

                                            // Only show category if it has connectors after filtering
                                            if (filteredConnectors.length === 0)
                                                return null;

                                            return (
                                                <div key={key} className='mb-6'>
                                                    <h5 className='text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2'>
                                                        {category.name} (
                                                        {
                                                            filteredConnectors.length
                                                        }
                                                        )
                                                    </h5>
                                                    <div className='grid grid-cols-3 gap-2'>
                                                        {filteredConnectors.map(
                                                            (
                                                                connector,
                                                                index,
                                                            ) => {
                                                                const isEnabled =
                                                                    isConnectorEnabled(
                                                                        connector.name,
                                                                    );
                                                                return (
                                                                    <div
                                                                        key={
                                                                            connector.id
                                                                        }
                                                                        draggable={
                                                                            isEnabled
                                                                        }
                                                                        onDragStart={(
                                                                            e,
                                                                        ) => {
                                                                            if (
                                                                                isEnabled
                                                                            ) {
                                                                                onDragStart(
                                                                                    e,
                                                                                    connector.type,
                                                                                );
                                                                            } else {
                                                                                e.preventDefault();
                                                                            }
                                                                        }}
                                                                        onClick={() => {
                                                                            if (
                                                                                isEnabled
                                                                            ) {
                                                                                onConnectorSelect(
                                                                                    connector.type,
                                                                                );
                                                                            }
                                                                        }}
                                                                        className={`connector-card flex flex-col items-center p-3 border-2 border-gray-200 rounded-xl ${
                                                                            isEnabled
                                                                                ? 'cursor-move bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 group'
                                                                                : 'cursor-not-allowed bg-gray-100 opacity-50 relative'
                                                                        }`}
                                                                        title={
                                                                            isEnabled
                                                                                ? connector.name
                                                                                : `${connector.name} (Not configured in Global Settings)`
                                                                        }
                                                                    >
                                                                        {!isEnabled && (
                                                                            <div className='absolute inset-0 bg-gray-900/20 rounded-xl flex items-center justify-center backdrop-blur-[1px] z-10'>
                                                                                <svg
                                                                                    className='w-6 h-6 text-gray-600'
                                                                                    fill='currentColor'
                                                                                    viewBox='0 0 20 20'
                                                                                >
                                                                                    <path
                                                                                        fillRule='evenodd'
                                                                                        d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                                                                                        clipRule='evenodd'
                                                                                    />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                        <div className='w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 ease-out shadow-md group-hover:shadow-lg'>
                                                                            {connector.icon ? (
                                                                                <div className='w-10 h-10 flex items-center justify-center'>
                                                                                    {
                                                                                        connector.icon
                                                                                    }
                                                                                </div>
                                                                            ) : (
                                                                                <span className='text-primary-600 text-xs'>
                                                                                    {
                                                                                        category.icon
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className='text-xs text-gray-800 text-center font-semibold leading-tight group-hover:text-blue-800 group-hover:scale-105 transition-all duration-300 ease-out'>
                                                                            {
                                                                                connector.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                ) : (
                                    // Category view: Display as grid
                                    <div className='grid grid-cols-2 gap-3'>
                                        {getDisplayedConnectors().map(
                                            (connector, index) => {
                                                const isEnabled =
                                                    isConnectorEnabled(
                                                        connector.name,
                                                    );
                                                return (
                                                    <div
                                                        key={connector.id}
                                                        draggable={isEnabled}
                                                        onDragStart={(e) => {
                                                            if (isEnabled) {
                                                                onDragStart(
                                                                    e,
                                                                    connector.type,
                                                                );
                                                            } else {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            if (isEnabled) {
                                                                onConnectorSelect(
                                                                    connector.type,
                                                                );
                                                            }
                                                        }}
                                                        className={`category-card flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl ${
                                                            isEnabled
                                                                ? 'cursor-move bg-gradient-to-br from-white to-gray-50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 group'
                                                                : 'cursor-not-allowed bg-gray-100 opacity-50 relative'
                                                        }`}
                                                        title={
                                                            isEnabled
                                                                ? connector.name
                                                                : `${connector.name} (Not configured in Global Settings)`
                                                        }
                                                    >
                                                        {!isEnabled && (
                                                            <div className='absolute inset-0 bg-gray-900/20 rounded-xl flex items-center justify-center backdrop-blur-[1px] z-10'>
                                                                <svg
                                                                    className='w-8 h-8 text-gray-600'
                                                                    fill='currentColor'
                                                                    viewBox='0 0 20 20'
                                                                >
                                                                    <path
                                                                        fillRule='evenodd'
                                                                        d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                                                                        clipRule='evenodd'
                                                                    />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div className='w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 ease-out shadow-lg'>
                                                            {connector.icon ? (
                                                                <div className='w-12 h-12 flex items-center justify-center'>
                                                                    {
                                                                        connector.icon
                                                                    }
                                                                </div>
                                                            ) : (
                                                                <span className='text-primary-600 text-sm'>
                                                                    {
                                                                        FILTERED_CONNECTOR_CATEGORIES[
                                                                            Object.keys(
                                                                                FILTERED_CONNECTOR_CATEGORIES,
                                                                            ).find(
                                                                                (
                                                                                    key,
                                                                                ) =>
                                                                                    FILTERED_CONNECTOR_CATEGORIES[
                                                                                        key as keyof typeof FILTERED_CONNECTOR_CATEGORIES
                                                                                    ].connectors.some(
                                                                                        (
                                                                                            c,
                                                                                        ) =>
                                                                                            c.id ===
                                                                                            connector.id,
                                                                                    ),
                                                                            ) as keyof typeof FILTERED_CONNECTOR_CATEGORIES
                                                                        ]?.icon
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className='text-sm text-gray-800 text-center font-bold group-hover:text-blue-800 group- group-hover:tracking-wider transition-all duration-300 ease-out'>
                                                            {connector.name}
                                                        </span>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}

                                {getDisplayedConnectors().length === 0 && (
                                    <div className='text-center text-gray-500 py-8'>
                                        <span>
                                            {searchQuery.trim()
                                                ? `No connectors found for "${searchQuery}"`
                                                : 'No connectors available'}
                                        </span>
                                        {searchQuery.trim() && (
                                            <div className='mt-2'>
                                                <button
                                                    onClick={() =>
                                                        setSearchQuery('')
                                                    }
                                                    className='text-primary-600 hover:text-primary-800 text-sm underline'
                                                >
                                                    Clear search
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ConnectorSlidingPanel;
