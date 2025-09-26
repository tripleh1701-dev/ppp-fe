'use client';

import React, {useState} from 'react';
import {WorkflowNodeType} from '@/types/workflow';
import {Icon} from './Icons';

// CSS animations for connector panel with immediate effects
const animationStyles = `
  @keyframes connectorFadeIn {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes connectorSlideUp {
    0% {
      opacity: 0;
      transform: translateY(30px) scale(0.8);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes connectorPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
    }
  }

  @keyframes iconFloat {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  .connector-fade-in {
    animation: connectorFadeIn 0.6s ease-out forwards;
    animation-fill-mode: both;
  }

  .connector-slide-up {
    animation: connectorSlideUp 0.8s ease-out forwards;
    animation-fill-mode: both;
  }

  .connector-pulse {
    animation: connectorPulse 2s ease-in-out infinite;
  }

  .icon-float {
    animation: iconFloat 3s ease-in-out infinite;
  }

  /* Enhanced hover effects */
  .connector-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .connector-card:hover {
    transform: translateY(-8px) scale(1.05);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .category-card {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .category-card:hover {
    transform: translateY(-12px) scale(1.08) rotateY(5deg);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  /* Staggered animation delays */
  .connector-card:nth-child(1) { animation-delay: 0ms; }
  .connector-card:nth-child(2) { animation-delay: 100ms; }
  .connector-card:nth-child(3) { animation-delay: 200ms; }
  .connector-card:nth-child(4) { animation-delay: 300ms; }
  .connector-card:nth-child(5) { animation-delay: 400ms; }
  .connector-card:nth-child(6) { animation-delay: 500ms; }
  .connector-card:nth-child(7) { animation-delay: 600ms; }
  .connector-card:nth-child(8) { animation-delay: 700ms; }
  .connector-card:nth-child(9) { animation-delay: 800ms; }
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
                id: 'code-bitbucket',
                name: 'Bitbucket',
                type: 'code_bitbucket' as WorkflowNodeType,
                icon: <Icon name='bitbucket' className='w-8 h-8' />,
            },
            {
                id: 'code-svn',
                name: 'SVN (Subversion)',
                type: 'code_svn' as WorkflowNodeType,
                icon: <Icon name='svn' className='w-8 h-8' />,
            },
            {
                id: 'code-mercurial',
                name: 'Mercurial',
                type: 'code_mercurial' as WorkflowNodeType,
                icon: <Icon name='mercurial' className='w-8 h-8' />,
            },
            {
                id: 'code-perforce',
                name: 'Perforce',
                type: 'code_perforce' as WorkflowNodeType,
                icon: <Icon name='perforce' className='w-8 h-8' />,
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
                id: 'build-azure',
                name: 'Azure Pipelines',
                type: 'build_azure_pipelines' as WorkflowNodeType,
                icon: <Icon name='azure' className='w-8 h-8' />,
            },
            {
                id: 'build-circleci',
                name: 'CircleCI',
                type: 'build_circleci' as WorkflowNodeType,
                icon: <Icon name='circleci' className='w-8 h-8' />,
            },
            {
                id: 'build-travis',
                name: 'Travis CI',
                type: 'build_travis' as WorkflowNodeType,
                icon: <Icon name='travis' className='w-8 h-8' />,
            },
            {
                id: 'build-gitlab-ci',
                name: 'GitLab CI',
                type: 'build_gitlab_ci' as WorkflowNodeType,
                icon: <Icon name='gitlab' className='w-8 h-8' />,
            },
            {
                id: 'build-teamcity',
                name: 'TeamCity',
                type: 'build_teamcity' as WorkflowNodeType,
                icon: <Icon name='teamcity' className='w-8 h-8' />,
            },
            {
                id: 'build-bamboo',
                name: 'Bamboo',
                type: 'build_bamboo' as WorkflowNodeType,
                icon: <Icon name='jenkins' className='w-8 h-8' />,
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
                id: 'test-jest',
                name: 'Jest',
                type: 'test_jest' as WorkflowNodeType,
                icon: <Icon name='jest' className='w-8 h-8' />,
            },
            {
                id: 'test-selenium',
                name: 'Selenium',
                type: 'test_selenium' as WorkflowNodeType,
                icon: <Icon name='selenium' className='w-8 h-8' />,
            },
            {
                id: 'test-cypress',
                name: 'Cypress',
                type: 'test_cypress' as WorkflowNodeType,
                icon: <Icon name='cypress' className='w-8 h-8' />,
            },
            {
                id: 'test-mocha',
                name: 'Mocha',
                type: 'test_mocha' as WorkflowNodeType,
                icon: (
                    <img
                        src='/images/logos/mocha.svg'
                        alt='Mocha'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'test-playwright',
                name: 'Playwright',
                type: 'test_playwright' as WorkflowNodeType,
                icon: (
                    <img
                        src='/images/logos/playwright.svg'
                        alt='Playwright'
                        className='w-8 h-8'
                    />
                ),
            },
            {
                id: 'test-testng',
                name: 'TestNG',
                type: 'test_testng' as WorkflowNodeType,
                icon: <Icon name='testng' className='w-8 h-8' />,
            },
            {
                id: 'test-puppeteer',
                name: 'Puppeteer',
                type: 'test_puppeteer' as WorkflowNodeType,
                icon: <Icon name='cypress' className='w-8 h-8' />,
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
                id: 'deploy-aws',
                name: 'AWS',
                type: 'deploy_aws' as WorkflowNodeType,
                icon: <Icon name='aws' className='w-8 h-8' />,
            },
            {
                id: 'deploy-gcp',
                name: 'Google Cloud',
                type: 'deploy_gcp' as WorkflowNodeType,
                icon: <Icon name='gcp' className='w-8 h-8' />,
            },
            {
                id: 'deploy-azure',
                name: 'Azure',
                type: 'deploy_azure' as WorkflowNodeType,
                icon: <Icon name='azure' className='w-8 h-8' />,
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
                id: 'release-docker',
                name: 'Docker Registry',
                type: 'release_docker' as WorkflowNodeType,
                icon: <Icon name='docker' className='w-8 h-8' />,
            },
            {
                id: 'release-npm',
                name: 'NPM Registry',
                type: 'release_npm' as WorkflowNodeType,
                icon: <Icon name='npm' className='w-8 h-8' />,
            },
            {
                id: 'release-maven',
                name: 'Maven Central',
                type: 'release_maven' as WorkflowNodeType,
                icon: <Icon name='maven' className='w-8 h-8' />,
            },
        ],
    },
};

interface ConnectorSlidingPanelProps {
    onConnectorSelect: (connectorType: WorkflowNodeType) => void;
    onDragStart: (event: React.DragEvent, nodeType: WorkflowNodeType) => void;
}

const ConnectorSlidingPanel: React.FC<ConnectorSlidingPanelProps> = ({
    onConnectorSelect,
    onDragStart,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null,
    );
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);
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
        return Object.values(CONNECTOR_CATEGORIES)
            .filter((cat) => cat.name !== 'Show All')
            .flatMap((category) => category.connectors);
    };

    const getDisplayedConnectors = () => {
        let connectors;
        if (selectedCategory && selectedCategory !== 'showAll') {
            connectors =
                CONNECTOR_CATEGORIES[
                    selectedCategory as keyof typeof CONNECTOR_CATEGORIES
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
                className={`relative h-full flex transition-all duration-300 ease-in-out shadow-lg cursor-pointer overflow-hidden ${
                    isHovered
                        ? 'w-[480px]' // Expanded width (bar + categories + connectors)
                        : 'w-12' // Just the blue bar
                }`}
                style={{
                    background:
                        'linear-gradient(180deg, #0171EC 0%, #005fca 100%)',
                }}
                onMouseEnter={() => {
                    setIsHovered(true);
                    if (!selectedCategory) {
                        setSelectedCategory(null); // This will show "All Connectors" by default
                    }
                }}
                onMouseLeave={() => {
                    setIsHovered(false);
                    setIsPanelExpanded(false);
                    setSelectedCategory(null);
                }}
            >
                {/* Blue Bar Section (always visible) */}
                <div className='w-12 h-full flex items-center justify-center group'>
                    {!isHovered && (
                        <div className='text-white text-sm font-semibold transform -rotate-90 whitespace-nowrap flex items-center gap-1 group-hover:scale-105 transition-transform duration-200'>
                            <svg
                                className='w-4 h-4 transform rotate-90'
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
                                <circle
                                    cx='3'
                                    cy='12'
                                    r='1'
                                    fill='currentColor'
                                >
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
                                <circle
                                    cx='21'
                                    cy='12'
                                    r='1'
                                    fill='currentColor'
                                >
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
                    )}
                </div>

                {/* Categories Section (visible on hover) */}
                <div
                    className={`flex-shrink-0 text-white p-2 flex flex-col justify-start pt-4 transition-all duration-300 ${
                        isHovered ? 'w-[160px] opacity-100' : 'w-0 opacity-0'
                    }`}
                >
                    <div className='space-y-2'>
                        <div className='text-center mb-3'>
                            <h3 className='text-base font-semibold text-white flex items-center justify-center gap-2'>
                                <svg
                                    className='w-4 h-4'
                                    fill='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <defs>
                                        <linearGradient
                                            id='connectorGradient2'
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
                                        fill='url(#connectorGradient2)'
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
                                Connectors
                            </h3>
                        </div>

                        <div
                            onClick={() => handleCategoryClick('showAll')}
                            className='flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-white/20 hover:backdrop-blur-sm hover:shadow-lg hover:transform hover:scale-[1.02] transition-all duration-200 group'
                        >
                            <div className='flex items-center space-x-2'>
                                <span className='text-lg'>☰</span>
                                <span className='text-sm font-medium'>
                                    Show All
                                </span>
                            </div>
                            <span className='bg-primary-700 text-xs px-2 py-1 rounded-full'>
                                {getAllConnectors().length}
                            </span>
                        </div>

                        <div className='border-t border-primary-800 my-2'></div>

                        {Object.entries(CONNECTOR_CATEGORIES)
                            .filter(([key]) => key !== 'showAll')
                            .map(([key, category]) => (
                                <div
                                    key={key}
                                    onClick={() => handleCategoryClick(key)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 ease-out group ${
                                        selectedCategory === key
                                            ? 'bg-white/40 backdrop-blur-sm shadow-xl transform scale-105 border-2 border-white/50 ring-2 ring-white/20'
                                            : 'hover:bg-white/25 hover:backdrop-blur-sm hover:shadow-xl hover:transform hover:scale-105 hover:border-2 hover:border-white/30 hover:-translate-y-1'
                                    }`}
                                >
                                    <div className='flex items-center space-x-2'>
                                        <span className='text-lg'>
                                            {category.icon}
                                        </span>
                                        <span className='text-sm font-medium'>
                                            {category.name}
                                        </span>
                                    </div>
                                    <span className='bg-white/25 text-xs px-3 py-1 rounded-full font-bold group-hover:bg-white/40 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-md group-hover:shadow-lg'>
                                        {category.connectors.length}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* White Section - Connectors (visible on hover) */}
                <div
                    className={`bg-white shadow-lg flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
                        isHovered ? 'w-[320px] opacity-100' : 'w-0 opacity-0'
                    }`}
                >
                    <div className='p-3 h-full flex flex-col'>
                        <h4 className='text-base font-semibold text-gray-800 mb-3 flex items-center gap-2'>
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
                            {selectedCategory && selectedCategory !== 'showAll'
                                ? CONNECTOR_CATEGORIES[
                                      selectedCategory as keyof typeof CONNECTOR_CATEGORIES
                                  ]?.name + ' Connectors'
                                : 'Connectors'}
                        </h4>

                        {/* Search Bar (only for Show All) */}
                        {isShowingAll && (
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
                                            onClick={() => setSearchQuery('')}
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
                                Object.entries(CONNECTOR_CATEGORIES)
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
                                                    {filteredConnectors.length})
                                                </h5>
                                                <div className='grid grid-cols-3 gap-2'>
                                                    {filteredConnectors.map(
                                                        (connector, index) => (
                                                            <div
                                                                key={
                                                                    connector.id
                                                                }
                                                                draggable
                                                                onDragStart={(
                                                                    e,
                                                                ) =>
                                                                    onDragStart(
                                                                        e,
                                                                        connector.type,
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    onConnectorSelect(
                                                                        connector.type,
                                                                    )
                                                                }
                                                                className='connector-card connector-fade-in flex flex-col items-center p-3 border-2 border-gray-200 rounded-xl cursor-move bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 group'
                                                            >
                                                                <div className='icon-float w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-indigo-200 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300 ease-out shadow-md group-hover:shadow-lg'>
                                                                    {connector.icon ? (
                                                                        <div className='w-7 h-7 flex items-center justify-center'>
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
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                // Category view: Display as grid
                                <div className='grid grid-cols-2 gap-3'>
                                    {getDisplayedConnectors().map(
                                        (connector, index) => (
                                            <div
                                                key={connector.id}
                                                draggable
                                                onDragStart={(e) =>
                                                    onDragStart(
                                                        e,
                                                        connector.type,
                                                    )
                                                }
                                                onClick={() =>
                                                    onConnectorSelect(
                                                        connector.type,
                                                    )
                                                }
                                                className='category-card connector-slide-up flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl cursor-move bg-gradient-to-br from-white to-gray-50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 group'
                                            >
                                                <div className='connector-pulse w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-indigo-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 ease-out shadow-lg group-hover:shadow-2xl'>
                                                    {connector.icon ? (
                                                        <div className='w-7 h-7 flex items-center justify-center'>
                                                            {connector.icon}
                                                        </div>
                                                    ) : (
                                                        <span className='text-primary-600 text-sm'>
                                                            {
                                                                CONNECTOR_CATEGORIES[
                                                                    Object.keys(
                                                                        CONNECTOR_CATEGORIES,
                                                                    ).find(
                                                                        (key) =>
                                                                            CONNECTOR_CATEGORIES[
                                                                                key as keyof typeof CONNECTOR_CATEGORIES
                                                                            ].connectors.some(
                                                                                (
                                                                                    c,
                                                                                ) =>
                                                                                    c.id ===
                                                                                    connector.id,
                                                                            ),
                                                                    ) as keyof typeof CONNECTOR_CATEGORIES
                                                                ]?.icon
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                <span className='text-sm text-gray-800 text-center font-bold group-hover:text-blue-800 group-hover:scale-110 group-hover:tracking-wider transition-all duration-300 ease-out'>
                                                    {connector.name}
                                                </span>
                                            </div>
                                        ),
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
            </div>
        </>
    );
};

export default ConnectorSlidingPanel;
