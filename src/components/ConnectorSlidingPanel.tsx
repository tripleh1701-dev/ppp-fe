'use client';

import React, {useState} from 'react';
import {WorkflowNodeType} from '@/types/workflow';

// Connector categories with their respective connectors
const CONNECTOR_CATEGORIES = {
    showAll: {
        name: 'Show All',
        icon: '☰',
        connectors: [],
    },
    node: {
        name: 'Node',
        icon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <circle cx='12' cy='12' r='3' opacity='0.8'>
                    <animate
                        attributeName='r'
                        values='3;5;3'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='opacity'
                        values='0.8;0.4;0.8'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='12' cy='12' r='1' fill='currentColor' />
                <path
                    d='M20 12h-2m-12 0H4m8-8v2m0 12v2'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
            </svg>
        ),
        connectors: [
            {
                id: 'node-dev',
                name: 'Dev Environment',
                type: 'node_dev' as WorkflowNodeType,
                icon: (
                    <svg
                        className='w-6 h-6'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path d='M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V7h16v12zM6 10h2v7H6zm4-1h2v8h-2zm4 3h2v5h-2z' />
                    </svg>
                ),
            },
            {
                id: 'node-qa',
                name: 'QA Environment',
                type: 'node_qa' as WorkflowNodeType,
                icon: (
                    <svg
                        className='w-6 h-6'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 2h2v10h-2V5zm4 0h2v7h-2V5zM7 8h2v7H7V8z' />
                    </svg>
                ),
            },
            {
                id: 'node-prod',
                name: 'Production Environment',
                type: 'node_prod' as WorkflowNodeType,
                icon: (
                    <svg
                        className='w-6 h-6'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                    </svg>
                ),
            },
        ],
    },
    plan: {
        name: 'Plan',
        icon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='16'
                    rx='2'
                    ry='2'
                    strokeWidth='2'
                />
                <line
                    x1='9'
                    y1='9'
                    x2='15'
                    y2='9'
                    strokeWidth='2'
                    strokeLinecap='round'
                >
                    <animate
                        attributeName='x2'
                        values='9;15;9'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </line>
                <line
                    x1='9'
                    y1='13'
                    x2='13'
                    y2='13'
                    strokeWidth='2'
                    strokeLinecap='round'
                >
                    <animate
                        attributeName='x2'
                        values='9;13;9'
                        dur='2.5s'
                        repeatCount='indefinite'
                    />
                </line>
                <line
                    x1='9'
                    y1='17'
                    x2='11'
                    y2='17'
                    strokeWidth='2'
                    strokeLinecap='round'
                >
                    <animate
                        attributeName='x2'
                        values='9;11;9'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </line>
            </svg>
        ),
        connectors: [
            {
                id: 'plan-jira',
                name: 'Jira',
                type: 'plan_jira' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#0052CC'>
                        <path d='M11.53 2c0 2.4-1.97 4.37-4.37 4.37H2.5L.5 8.77c0-3.87 3.13-7 7-7h4.03V2zm0 10.49c0 2.4-1.97 4.37-4.37 4.37H2.5l-2-2.4c0-3.87 3.13-7 7-7h4.03v4.03z' />
                        <path d='M12.47 2c0 2.4 1.97 4.37 4.37 4.37h4.66l2-2.4c0 3.87-3.13 7-7 7h-4.03V2zm0 10.49c0 2.4 1.97 4.37 4.37 4.37h4.66l2-2.4c0 3.87-3.13 7-7 7h-4.03v-9z' />
                    </svg>
                ),
            },
            {
                id: 'plan-trello',
                name: 'Trello',
                type: 'plan_trello' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#0079BF'>
                        <path d='M21 0H3a3 3 0 00-3 3v18a3 3 0 003 3h18a3 3 0 003-3V3a3 3 0 00-3-3zM10.44 18.18a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5V5.82a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5v12.36zm8.5-4.68a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5V5.82a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5V13.5z' />
                    </svg>
                ),
            },
            {
                id: 'plan-asana',
                name: 'Asana',
                type: 'plan_asana' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#F06A6A'>
                        <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.5 12c0 1.933-1.567 3.5-3.5 3.5s-3.5-1.567-3.5-3.5 1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5zM12 8.5c1.933 0 3.5-1.567 3.5-3.5S13.933 1.5 12 1.5 8.5 3.067 8.5 5s1.567 3.5 3.5 3.5zM5.5 8.5c1.933 0 3.5 1.567 3.5 3.5S7.433 15.5 5.5 15.5 2 13.933 2 12s1.567-3.5 3.5-3.5z' />
                    </svg>
                ),
            },
        ],
    },
    code: {
        name: 'Code',
        icon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <path
                    d='M16 18l6-6-6-6M8 6l-6 6 6 6'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <animateTransform
                        attributeName='transform'
                        type='scale'
                        values='1;1.1;1'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </path>
                <circle cx='12' cy='12' r='1' fill='currentColor'>
                    <animate
                        attributeName='r'
                        values='1;2;1'
                        dur='1.5s'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='opacity'
                        values='1;0.5;1'
                        dur='1.5s'
                        repeatCount='indefinite'
                    />
                </circle>
            </svg>
        ),
        connectors: [
            {
                id: 'code-github',
                name: 'GitHub',
                type: 'code_github' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#181717'>
                        <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' />
                    </svg>
                ),
            },
            {
                id: 'code-gitlab',
                name: 'GitLab',
                type: 'code_gitlab' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#FC6D26'>
                        <path d='M12 24l8-24h-4l-4 12-4-12h-4l8 24z' />
                    </svg>
                ),
            },
            {
                id: 'code-bitbucket',
                name: 'Bitbucket',
                type: 'code_bitbucket' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#0052CC'>
                        <path d='M.778 1.211a.768.768 0 00-.768.892l3.263 19.811c.084.499.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.9H.778zM14.52 15.53H9.522L8.17 8.466h7.561l-1.211 7.064z' />
                    </svg>
                ),
            },
        ],
    },
    build: {
        name: 'Build',
        icon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <path
                    d='M12 6V4a2 2 0 012-2h4a2 2 0 012 2v2'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <rect
                    x='6'
                    y='6'
                    width='12'
                    height='12'
                    rx='2'
                    ry='2'
                    strokeWidth='2'
                >
                    <animate
                        attributeName='height'
                        values='12;14;12'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </rect>
                <line
                    x1='9'
                    y1='10'
                    x2='15'
                    y2='10'
                    strokeWidth='2'
                    strokeLinecap='round'
                >
                    <animate
                        attributeName='opacity'
                        values='1;0.3;1'
                        dur='1.5s'
                        repeatCount='indefinite'
                    />
                </line>
                <line
                    x1='9'
                    y1='14'
                    x2='13'
                    y2='14'
                    strokeWidth='2'
                    strokeLinecap='round'
                >
                    <animate
                        attributeName='opacity'
                        values='1;0.3;1'
                        dur='1.8s'
                        repeatCount='indefinite'
                    />
                </line>
            </svg>
        ),
        connectors: [
            {
                id: 'build-jenkins',
                name: 'Jenkins',
                type: 'build_jenkins' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#D33833'>
                        <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 7.293a6.977 6.977 0 01-.411 4.293 6.971 6.971 0 01-2.68 2.68 6.977 6.977 0 01-4.293.411l-.77-.184c-.293-.07-.59-.07-.883 0l-.77.184a6.977 6.977 0 01-4.293-.411 6.971 6.971 0 01-2.68-2.68 6.977 6.977 0 01-.411-4.293l.184-.77c.07-.293.07-.59 0-.883l-.184-.77a6.977 6.977 0 01.411-4.293 6.971 6.971 0 012.68-2.68 6.977 6.977 0 014.293-.411l.77.184c.293.07.59.07.883 0l.77-.184a6.977 6.977 0 014.293.411 6.971 6.971 0 012.68 2.68 6.977 6.977 0 01.411 4.293l-.184.77c-.07.293-.07.59 0 .883l.184.77z' />
                    </svg>
                ),
            },
            {
                id: 'build-github-actions',
                name: 'GitHub Actions',
                type: 'build_github_actions' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#2088FF'>
                        <path d='M10.984 13.836a.5.5 0 01-.353-.146L9.146 12.207a.5.5 0 010-.707l1.485-1.483a.5.5 0 01.707 0l1.485 1.483a.5.5 0 010 .707l-1.485 1.483a.5.5 0 01-.354.146zm2.147-2.317a.5.5 0 00-.707 0l-.83.83a.5.5 0 000 .707l.83.83a.5.5 0 00.707 0l.83-.83a.5.5 0 000-.707l-.83-.83z' />
                        <path d='M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1z' />
                    </svg>
                ),
            },
            {
                id: 'build-azure',
                name: 'Azure Pipelines',
                type: 'build_azure_pipelines' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#0078D4'>
                        <path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zM7.56 16.3c-.48 0-.87-.39-.87-.87s.39-.87.87-.87.87.39.87.87-.39.87-.87.87zm0-3.48c-.48 0-.87-.39-.87-.87s.39-.87.87-.87.87.39.87.87-.39.87-.87.87zm0-3.48c-.48 0-.87-.39-.87-.87s.39-.87.87-.87.87.39.87.87-.39.87-.87.87zm4.35 6.96c-.48 0-.87-.39-.87-.87s.39-.87.87-.87.87.39.87.87-.39.87-.87.87zm0-3.48c-.48 0-.87-.39-.87-.87s.39-.87.87-.87.87.39.87.87-.39.87-.87.87zm0-3.48c-.48 0-.87-.39-.87-.87s.39-.87.87-.87.87.39.87.87-.39.87-.87.87zm4.35 6.96c-.48 0-.87-.39-.87-.87s.39-.87.87-.87.87.39.87.87-.39.87-.87.87z' />
                    </svg>
                ),
            },
        ],
    },
    test: {
        name: 'Test',
        icon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <path
                    d='M9 12l2 2 4-4'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <animate
                        attributeName='stroke-dasharray'
                        values='0 100;100 0;0 100'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </path>
                <circle cx='12' cy='12' r='9' strokeWidth='2'>
                    <animate
                        attributeName='stroke-dasharray'
                        values='0 60;30 30;60 0;30 30;0 60'
                        dur='4s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='12' cy='12' r='3' fill='currentColor' opacity='0.3'>
                    <animate
                        attributeName='r'
                        values='3;5;3'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='opacity'
                        values='0.3;0.7;0.3'
                        dur='2s'
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
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#C21325'>
                        <path d='M22.251 11.82a3.117 3.117 0 0 0-2.328-3.01L22.911 0H8.104L11.092 8.81a3.116 3.116 0 0 0-2.244 2.988c0 1.726 1.407 3.132 3.132 3.132.179 0 .357-.016.53-.057l1.713 5.027c.323.945 1.167 1.526 2.01 1.526.78 0 1.44-.493 1.7-1.526l1.556-4.72c.18.043.367.054.558.054 1.725 0 3.132-1.407 3.132-3.133 0-.353-.060-.692-.128-1.026zM12.583 2.729h5.975l-1.226 6.109h-3.522l-1.227-6.109zm5.44 16.446l-1.556 4.72c-.15.441-.42.442-.571 0l-1.714-5.03c.456-.201.83-.55 1.067-.975.255.462.673.784 1.138.784.465 0 .884-.323 1.139-.785.275.463.693.786 1.497.286z' />
                    </svg>
                ),
            },
            {
                id: 'test-selenium',
                name: 'Selenium',
                type: 'test_selenium' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#43B02A'>
                        <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.506a.8.8 0 01-1.1.3l-3.799-2.198a.8.8 0 01-.4-.693v-4.39a.8.8 0 01.4-.693l3.799-2.198a.8.8 0 011.1.3.8.8 0 01-.3 1.1l-3.4 1.968v3.936l3.4 1.968a.8.8 0 01.3 1.1zM8.5 12a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z' />
                    </svg>
                ),
            },
            {
                id: 'test-cypress',
                name: 'Cypress',
                type: 'test_cypress' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#17202C'>
                        <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.301 0 9.6 4.299 9.6 9.6s-4.299 9.6-9.6 9.6S2.4 17.301 2.4 12 6.699 2.4 12 2.4zm0 2.4a7.2 7.2 0 100 14.4 7.2 7.2 0 000-14.4zm0 1.2a6 6 0 110 12 6 6 0 010-12z' />
                    </svg>
                ),
            },
        ],
    },
    deploy: {
        name: 'Deploy',
        icon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <path
                    d='M7 11l5-5 5 5'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                >
                    <animateTransform
                        attributeName='transform'
                        type='translate'
                        values='0,0;0,-2;0,0'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </path>
                <path
                    d='M12 19V6'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <circle cx='18' cy='8' r='2' strokeWidth='2'>
                    <animate
                        attributeName='r'
                        values='2;3;2'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='opacity'
                        values='1;0.5;1'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='6' cy='16' r='2' strokeWidth='2'>
                    <animate
                        attributeName='r'
                        values='2;3;2'
                        dur='2.5s'
                        repeatCount='indefinite'
                    />
                    <animate
                        attributeName='opacity'
                        values='1;0.5;1'
                        dur='2.5s'
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
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#326CE5'>
                        <path d='M10.204 14.35l.007.01-.999 2.413a5.171 5.171 0 0 1-2.075-2.597l2.578-.437.004.005a.44.44 0 0 1 .49-.394h-.005zm.173-2.983a.458.458 0 0 1-.35-.21l-.005-.006-1.247-2.05a5.146 5.146 0 0 1 2.723-.694V10.6a.44.44 0 0 1 .098.42l-.22-.653zm1.093 3.427l.01-.008 2.409 1.003a5.171 5.171 0 0 1-2.598 2.075l-.437-2.578-.005.004a.44.44 0 0 1-.394-.49l.015-.006zm2.983-.173a.458.458 0 0 1-.21.35l-.006.005-2.05 1.247a5.146 5.146 0 0 1-.694-2.723H13.7a.44.44 0 0 1 .42-.098l-.667.22zm-3.427-1.093l-.008-.01-1.003-2.409a5.171 5.171 0 0 1 2.075-2.598l.437 2.578-.004.005a.44.44 0 0 1 .49.394l.006-.015zm-.173 2.983a.458.458 0 0 1 .35.21l.005.006 1.247 2.05a5.146 5.146 0 0 1-2.723.694V13.6a.44.44 0 0 1-.098-.42l.22.653zm-1.093-3.427l-.01.008-2.409-1.003a5.171 5.171 0 0 1 2.598-2.075l.437 2.578.005-.004a.44.44 0 0 1 .394.49l-.015.006zm-2.983.173a.458.458 0 0 1 .21-.35l.006-.005 2.05-1.247a5.146 5.146 0 0 1 .694 2.723H10.3a.44.44 0 0 1-.42.098l.667-.22zM12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12z' />
                    </svg>
                ),
            },
            {
                id: 'deploy-helm',
                name: 'Helm',
                type: 'deploy_helm' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#0F1689'>
                        <path d='M12 2L2 7v10l10 5 10-5V7l-10-5zM6.5 10.5L12 8l5.5 2.5L12 13l-5.5-2.5z' />
                    </svg>
                ),
            },
            {
                id: 'deploy-aws',
                name: 'AWS',
                type: 'deploy_aws' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#FF9900'>
                        <path d='M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576a.598.598 0 01.08.32c0 .128-.08.256-.24.384l-.8.528a.619.619 0 01-.336.112c-.128 0-.256-.064-.384-.176a3.734 3.734 0 01-.464-.608 9.21 9.21 0 01-.4-.735c-.976 1.151-2.2 1.727-3.68 1.727-1.056 0-1.904-.304-2.544-.912-.64-.608-.96-1.416-.96-2.432 0-1.072.384-1.936 1.152-2.592.768-.656 1.792-.984 3.072-.984.432 0 .88.032 1.328.112.464.08.928.176 1.424.32v-1.056c0-1.104-.224-1.856-.688-2.288-.448-.432-1.216-.64-2.288-.64-.496 0-1.008.064-1.536.176-.528.112-1.04.272-1.536.48a4.583 4.583 0 01-.848.224.705.705 0 01-.176-.032.334.334 0 01-.128-.128.65.65 0 01-.064-.224v-.352c0-.144.016-.256.064-.336a.72.72 0 01.24-.24 3.355 3.355 0 01.752-.352 5.668 5.668 0 011.568-.208c1.792 0 3.104.416 3.936 1.264.832.832 1.248 2.096 1.248 3.776v4.992zm-5.088 1.92c.416 0 .848-.08 1.312-.224.464-.144.864-.384 1.2-.704.192-.192.336-.4.416-.64.08-.24.128-.528.128-.864v-.416a11.63 11.63 0 00-1.136-.272 7.99 7.99 0 00-1.2-.096c-.848 0-1.472.176-1.888.528-.416.352-.624.864-.624 1.536 0 .64.16 1.104.464 1.424.304.304.72.464 1.328.464v.016zm9.072 1.28a.66.66 0 01-.432-.112c-.112-.08-.208-.24-.272-.48L7.51 2.209a1.649 1.649 0 01-.064-.496c0-.208.096-.32.288-.32h1.168c.192 0 .336.032.416.112.112.064.192.224.256.464l2.24 8.832 2.08-8.832a.948.948 0 01.256-.464.7.7 0 01.432-.112h.944c.192 0 .336.032.432.112a.948.948 0 01.256.464l2.112 8.944 2.304-8.944a.804.804 0 01.256-.464.7.7 0 01.432-.112h1.104c.192 0 .304.096.304.32 0 .064-.016.144-.032.224a1.46 1.46 0 01-.048.272l-3.2 10.336a.804.804 0 01-.272.48.651.651 0 01-.432.112h-1.024a.7.7 0 01-.432-.112.948.948 0 01-.256-.464L13.191 4.93l-2.048 8.848a.804.804 0 01-.256.464.7.7 0 01-.432.112h-1.024v-.016zm14.528.416c-1.728 0-3.04-.4-3.936-1.2-.896-.8-1.36-1.904-1.36-3.328 0-1.472.48-2.608 1.44-3.392.96-.784 2.272-1.184 3.936-1.184.544 0 1.104.048 1.68.144.576.096 1.12.224 1.632.384v-.96c0-.832-.176-1.424-.528-1.792-.352-.368-.896-.544-1.632-.544-.448 0-.912.048-1.376.144-.464.096-.896.208-1.296.352a2.899 2.899 0 01-.592.144.425.425 0 01-.304-.112.578.578 0 01-.144-.384v-.288c0-.128.032-.24.096-.32.064-.08.176-.144.336-.208.448-.224.976-.416 1.584-.56.608-.144 1.216-.208 1.824-.208 1.392 0 2.416.32 3.056.96.64.64.96 1.632.96 2.976v3.936c0 .256-.032.432-.096.544a.56.56 0 01-.352.208h-.816a.56.56 0 01-.384-.128.65.65 0 01-.16-.384l-.096-.8c-.288.416-.656.752-1.104 1.008-.448.256-.992.384-1.632.384zm.432-1.024c.4 0 .8-.08 1.168-.24.368-.16.672-.416.896-.752.128-.192.224-.4.272-.624.048-.224.08-.48.08-.768v-.384a6.005 6.005 0 00-1.264-.272 7.479 7.479 0 00-1.168-.096c-.688 0-1.2.128-1.536.384-.336.256-.496.624-.496 1.12 0 .464.128.816.384 1.056.272.24.656.352 1.152.352l.016.016-.032.048v.032.048z' />
                    </svg>
                ),
            },
            {
                id: 'deploy-gcp',
                name: 'Google Cloud',
                type: 'deploy_gcp' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#4285F4'>
                        <path d='M12.19 2.38a9.91 9.91 0 0 1 9.43 9.43 9.91 9.91 0 0 1-9.43 9.43 9.91 9.91 0 0 1-9.43-9.43 9.91 9.91 0 0 1 9.43-9.43zm5.24 7.89a7.15 7.15 0 0 0-1.54-2.84l.94-.94a8.78 8.78 0 0 1 2.08 3.78h-1.48zm-1.54 2.84H14.4v1.48h1.49a7.15 7.15 0 0 0 1.54-2.84l.94.94a8.78 8.78 0 0 1-2.08 3.78l-.94-.94a7.15 7.15 0 0 0 .94-2.42zM12.19 5.38a6.43 6.43 0 0 0-6.43 6.43 6.43 6.43 0 0 0 6.43 6.43 6.43 6.43 0 0 0 6.43-6.43 6.43 6.43 0 0 0-6.43-6.43zm0 1.48a4.95 4.95 0 0 1 4.95 4.95 4.95 4.95 0 0 1-4.95 4.95 4.95 4.95 0 0 1-4.95-4.95 4.95 4.95 0 0 1 4.95-4.95z' />
                    </svg>
                ),
            },
            {
                id: 'deploy-azure',
                name: 'Azure',
                type: 'deploy_azure' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#0078D4'>
                        <path d='M5.947 14.41L10.47 3.28a.516.516 0 01.464-.288h4.508a.515.515 0 01.469.726L13.547 9.42h4.922a.515.515 0 01.398.838l-11.97 11.15a.515.515 0 01-.864-.42l.914-6.578z' />
                    </svg>
                ),
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
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#4CAF50'>
                        <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' />
                        <circle
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='2'
                            fill='none'
                        />
                    </svg>
                ),
            },
            {
                id: 'approval-slack',
                name: 'Slack Approval',
                type: 'approval_slack' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#4A154B'>
                        <path d='M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.12h2.52v2.522a2.528 2.528 0 0 1-2.52 2.523Zm0 0a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165v-2.523h2.522a2.528 2.528 0 0 1 2.52 2.523Zm7.458-10.042a2.528 2.528 0 0 1 2.523-2.52A2.528 2.528 0 0 1 17.545 5.123v2.52H15.023a2.528 2.528 0 0 1-2.523-2.52Zm0 0a2.528 2.528 0 0 1 2.523-2.52A2.528 2.528 0 0 1 17.545 5.123H15.023a2.528 2.528 0 0 1-2.523-2.52Zm10.042 7.458a2.528 2.528 0 0 1 2.523 2.52 2.528 2.528 0 0 1-2.523 2.523h-2.52v-2.523a2.528 2.528 0 0 1 2.52-2.52Z' />
                    </svg>
                ),
            },
            {
                id: 'approval-teams',
                name: 'Teams Approval',
                type: 'approval_teams' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#6264A7'>
                        <path d='M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM11 18c-3.859 0-7-3.14-7-7s3.141-7 7-7 7 3.14 7 7-3.141 7-7 7z' />
                        <path d='M11 7a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 1 0 0-2h-2V8a1 1 0 0 0-1-1z' />
                    </svg>
                ),
            },
        ],
    },
    release: {
        name: 'Release',
        icon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                <rect
                    x='3'
                    y='8'
                    width='18'
                    height='11'
                    rx='2'
                    ry='2'
                    strokeWidth='2'
                />
                <circle cx='8' cy='21' r='1' fill='currentColor'>
                    <animate
                        attributeName='cy'
                        values='21;19;21'
                        dur='2s'
                        repeatCount='indefinite'
                    />
                </circle>
                <circle cx='16' cy='21' r='1' fill='currentColor'>
                    <animate
                        attributeName='cy'
                        values='21;19;21'
                        dur='2.5s'
                        repeatCount='indefinite'
                    />
                </circle>
                <path
                    d='M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <path d='M9 12h6' strokeWidth='2' strokeLinecap='round'>
                    <animate
                        attributeName='stroke-dasharray'
                        values='0 12;6 6;12 0;6 6;0 12'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </path>
            </svg>
        ),
        connectors: [
            {
                id: 'release-docker',
                name: 'Docker Registry',
                type: 'release_docker' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#2496ED'>
                        <path d='M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186H8.1a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186H5.136a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338 0-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983 0 1.98-.09 2.96-.266a12.21 12.21 0 003.371-1.09 9.65 9.65 0 002.61-2.14 10.17 10.17 0 001.714-2.333c.985.017 2.9.029 4.438-1.707a.85.85 0 00.14-.478l.014-.332c-.01-.263-.16-.542-.272-.659M8.718 6.29a.185.185 0 00-.185-.185H6.415a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.186h2.118a.186.186 0 00.185-.186V6.29z' />
                    </svg>
                ),
            },
            {
                id: 'release-npm',
                name: 'NPM Registry',
                type: 'release_npm' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#CB3837'>
                        <path d='M0 7.334v8h6.666v1.332H12V7.334H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.332v5.332h-2.667v-.001zm12.001-5.332v5.333h-2.667v1.333H16v-1.333h-1.335V8.667H24zM10.665 10H12v2.667h-1.335V10zm8.001 0v2.667H17.33v-2.667h1.336zm-5.337 0h1.337v2.667h-1.337V10z' />
                    </svg>
                ),
            },
            {
                id: 'release-maven',
                name: 'Maven Central',
                type: 'release_maven' as WorkflowNodeType,
                icon: (
                    <svg className='w-6 h-6' viewBox='0 0 24 24' fill='#C71A36'>
                        <path d='M22.447 1.553L1.553 22.447a2 2 0 002.829 2.829L25.276 4.382a2 2 0 00-2.829-2.829zM6.447 6.447L17.553 17.553a1 1 0 01-1.414 1.414L5.033 7.861a1 1 0 011.414-1.414zM12 0a12 12 0 100 24 12 12 0 000-24zm0 2a10 10 0 110 20 10 10 0 010-20z' />
                    </svg>
                ),
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
        if (selectedCategory && selectedCategory !== 'showAll') {
            return (
                CONNECTOR_CATEGORIES[
                    selectedCategory as keyof typeof CONNECTOR_CATEGORIES
                ]?.connectors || []
            );
        }
        // When selectedCategory is null (Show All clicked), return all connectors
        return getAllConnectors();
    };

    const isShowingAll = selectedCategory === null;

    return (
        <div
            className={`relative h-full flex transition-all duration-300 ease-in-out shadow-lg cursor-pointer overflow-hidden ${
                isHovered
                    ? 'w-[480px]' // Expanded width (bar + categories + connectors)
                    : 'w-12' // Just the blue bar
            }`}
            style={{
                background: 'linear-gradient(180deg, #93C5FD 0%, #60A5FA 100%)',
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
            <div className='w-12 h-full flex items-center justify-center'>
                {!isHovered && (
                    <div className='text-white text-sm font-semibold transform -rotate-90 whitespace-nowrap'>
                        🔗 Connectors
                    </div>
                )}
            </div>

            {/* Categories Section (visible on hover) */}
            <div
                className={`flex-shrink-0 text-white p-3 flex flex-col justify-center transition-all duration-300 ${
                    isHovered ? 'w-[160px] opacity-100' : 'w-0 opacity-0'
                }`}
            >
                <div className='space-y-3'>
                    <div className='text-center mb-4'>
                        <h3 className='text-lg font-semibold text-white'>
                            🔗 Connectors
                        </h3>
                    </div>

                    <div
                        onClick={() => handleCategoryClick('showAll')}
                        className='flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-blue-600 hover:shadow-md hover:transform hover:scale-102 transition-all duration-200'
                    >
                        <div className='flex items-center space-x-2'>
                            <span className='text-lg'>☰</span>
                            <span className='text-sm font-medium'>
                                Show All
                            </span>
                        </div>
                        <span className='bg-blue-600 text-xs px-2 py-1 rounded-full'>
                            {getAllConnectors().length}
                        </span>
                    </div>

                    <div className='border-t border-blue-700 my-2'></div>

                    {Object.entries(CONNECTOR_CATEGORIES)
                        .filter(([key]) => key !== 'showAll')
                        .map(([key, category]) => (
                            <div
                                key={key}
                                onClick={() => handleCategoryClick(key)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedCategory === key
                                        ? 'bg-blue-700 shadow-lg transform scale-105'
                                        : 'hover:bg-blue-600 hover:shadow-md hover:transform hover:scale-102'
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
                                <span className='bg-blue-600 text-xs px-2 py-1 rounded-full'>
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
                <div className='p-4 h-full flex flex-col'>
                    <h4 className='text-lg font-semibold text-gray-800 mb-4'>
                        {selectedCategory && selectedCategory !== 'showAll'
                            ? CONNECTOR_CATEGORIES[
                                  selectedCategory as keyof typeof CONNECTOR_CATEGORIES
                              ]?.name + ' Connectors'
                            : 'Connectors'}
                    </h4>

                    {/* Search Bar (only for Show All) */}
                    {isShowingAll && (
                        <div className='relative mb-4'>
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
                                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm'
                            />
                        </div>
                    )}

                    <div className='flex-1 overflow-y-auto'>
                        {isShowingAll ? (
                            // Show All: Display with category separators
                            Object.entries(CONNECTOR_CATEGORIES)
                                .filter(
                                    ([key]) =>
                                        key !== 'showAll' &&
                                        CONNECTOR_CATEGORIES[
                                            key as keyof typeof CONNECTOR_CATEGORIES
                                        ].connectors.length > 0,
                                )
                                .map(([key, category]) => (
                                    <div key={key} className='mb-6'>
                                        <h5 className='text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2'>
                                            {category.name} (
                                            {category.connectors.length})
                                        </h5>
                                        <div className='grid grid-cols-3 gap-2'>
                                            {category.connectors.map(
                                                (connector) => (
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
                                                        className='flex flex-col items-center p-2 border border-gray-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-lg hover:transform hover:scale-105 transition-all duration-200 bg-white hover:bg-blue-50'
                                                    >
                                                        <div className='w-6 h-6 bg-blue-100 rounded flex items-center justify-center mb-1'>
                                                            {connector.icon ? (
                                                                <div className='w-5 h-5 flex items-center justify-center'>
                                                                    {
                                                                        connector.icon
                                                                    }
                                                                </div>
                                                            ) : (
                                                                <span className='text-blue-600 text-xs'>
                                                                    {
                                                                        category.icon
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className='text-xs text-gray-700 text-center font-medium leading-tight'>
                                                            {connector.name}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ))
                        ) : (
                            // Category view: Display as grid
                            <div className='grid grid-cols-2 gap-3'>
                                {getDisplayedConnectors().map((connector) => (
                                    <div
                                        key={connector.id}
                                        draggable
                                        onDragStart={(e) =>
                                            onDragStart(e, connector.type)
                                        }
                                        onClick={() =>
                                            onConnectorSelect(connector.type)
                                        }
                                        className='flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-xl hover:transform hover:scale-105 transition-all duration-300 bg-gray-50 hover:bg-blue-50'
                                    >
                                        <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2'>
                                            {connector.icon ? (
                                                <div className='w-6 h-6 flex items-center justify-center'>
                                                    {connector.icon}
                                                </div>
                                            ) : (
                                                <span className='text-blue-600 text-sm'>
                                                    {
                                                        CONNECTOR_CATEGORIES[
                                                            Object.keys(
                                                                CONNECTOR_CATEGORIES,
                                                            ).find((key) =>
                                                                CONNECTOR_CATEGORIES[
                                                                    key as keyof typeof CONNECTOR_CATEGORIES
                                                                ].connectors.some(
                                                                    (c) =>
                                                                        c.id ===
                                                                        connector.id,
                                                                ),
                                                            ) as keyof typeof CONNECTOR_CATEGORIES
                                                        ]?.icon
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        <span className='text-xs text-gray-700 text-center font-medium'>
                                            {connector.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {getDisplayedConnectors().length === 0 && (
                            <div className='text-center text-gray-500 py-8'>
                                <span>No connectors available</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectorSlidingPanel;
