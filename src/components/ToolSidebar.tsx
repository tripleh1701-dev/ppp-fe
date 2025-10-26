'use client';

import {useState, useEffect} from 'react';
import {WorkflowNodeType} from '@/types/workflow';

interface ToolCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    tools: Tool[];
}

interface Tool {
    id: string;
    name: string;
    icon: string;
    nodeType: WorkflowNodeType;
}

// Real tool/app SVG icons as React components
const ToolIcon = ({tool}: {tool: Tool}) => {
    const getIcon = () => {
        switch (tool.id) {
            case 'github':
                return (
                    <div className='w-8 h-8 bg-gradient-to-br from-gray-900 to-black rounded-lg p-1.5 shadow-md'>
                        <svg
                            className='w-full h-full'
                            viewBox='0 0 24 24'
                            fill='white'
                        >
                            <path d='M12 0C5.374 0 0 5.373 0 12c0 5.302 2.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C19.438 21.8 24 17.302 24 12c0-6.627-5.373-12-12-12z' />
                        </svg>
                    </div>
                );
            case 'gitlab':
                return (
                    <div className='w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-1.5 shadow-md'>
                        <svg
                            className='w-full h-full'
                            viewBox='0 0 24 24'
                            fill='white'
                        >
                            <path d='M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.423-.73-.423-.867 0L16.418 9.45H7.582L4.918 1.263c-.135-.423-.73-.423-.867 0L1.387 9.452.045 13.587c-.121.375.014.789.331 1.023L12 23.054l11.624-8.443c.318-.235.453-.648.331-1.024' />
                        </svg>
                    </div>
                );
            case 'bitbucket':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z' />
                    </svg>
                );
            case 'jira':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M11.53 2c0 2.4 1.97 4.37 4.37 4.37h.54v.54c0 2.4 1.97 4.37 4.37 4.37V2zm0 9.27c0 2.4 1.97 4.37 4.37 4.37h.54v.54c0 2.4 1.97 4.37 4.37 4.37v-9.28zM2 11.53c2.4 0 4.37-1.97 4.37-4.37V6.62h.54c2.4 0 4.37-1.97 4.37-4.37H2z' />
                    </svg>
                );
            case 'trello':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M21 0H3C1.343 0 0 1.343 0 3v18c0 1.657 1.343 3 3 3h18c1.657 0 3-1.343 3-3V3c0-1.657-1.343-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.646-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v12.36zm9.44-6.54c0 .795-.645 1.44-1.44 1.44H14c-.795 0-1.44-.645-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v5.82z' />
                    </svg>
                );
            case 'jenkins':
                return (
                    <div className='w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-1.5 shadow-md'>
                        <svg
                            className='w-full h-full'
                            viewBox='0 0 24 24'
                            fill='white'
                        >
                            <path d='M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 1.5A8.5 8.5 0 1020.5 12 8.5 8.5 0 0012 3.5zm0 3A1.5 1.5 0 1110.5 8 1.5 1.5 0 0112 6.5zm0 4.5A1.5 1.5 0 1110.5 12 1.5 1.5 0 0112 11zm0 4.5A1.5 1.5 0 1110.5 16 1.5 1.5 0 0112 15.5z' />
                        </svg>
                    </div>
                );
            case 'docker':
                return (
                    <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 shadow-md'>
                        <svg
                            className='w-full h-full'
                            viewBox='0 0 24 24'
                            fill='white'
                        >
                            <path d='M8.8 8.8h1.6v1.6H8.8V8.8zm0-3.2h1.6v1.6H8.8V5.6zm3.2 0h1.6v1.6H12V5.6zm0 3.2h1.6v1.6H12V8.8zm3.2 0h1.6v1.6h-1.6V8.8zM12 12h1.6v1.6H12V12zm-3.2 0h1.6v1.6H8.8V12zm-3.2 0h1.6v1.6H5.6V12zm19.2-1.6c-.3-.8-1.2-1.4-2.4-1.4-.4 0-.8.1-1.2.2-.4-2.4-2.4-3.6-2.6-3.7l-.5-.3-.3.5c-.4.6-.7 1.3-.9 2-.3 1.4-.1 2.7.6 3.8-.9.5-2.4.6-2.7.6H.9c-.3 0-.5.3-.5.6 0 .1 0 .3.1.6.8 2 2 3.6 3.6 4.7 1.8 1.1 4.6 1.7 7.9 1.7 1.5 0 3-.1 4.4-.4 1.8-.4 3.4-.9 4.7-1.7 1.2-.7 2.2-1.5 3.1-2.6 1.5-2 2.4-4.5 3.1-6.6h.3c2.1 0 3.3-.8 4-1.5.5-.4.8-.9 1.1-1.5l.1-.4L22.8 10.4z' />
                        </svg>
                    </div>
                );
            case 'aws':
                return (
                    <div className='w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-1.5 shadow-md'>
                        <svg
                            className='w-full h-full'
                            viewBox='0 0 24 24'
                            fill='white'
                        >
                            <path d='M18.4 14.9c-1.2.8-2.9 1.3-4.4 1.3-2.1 0-4-.8-5.4-2.1-.1-.1-.1-.2 0-.3.6-.4 1.4-.7 2.1-1 .8-.3 1.8-.5 2.7-.5 1.6 0 3.2.3 4.7.9.2.1.4.2.5.4.1.2 0 .3-.2.3zm1.1-1.3c-.1-.2-.3-.3-.5-.3-.8-.5-2.1-.8-3.3-.8-1.5 0-3 .4-4.2 1.1-.8.5-1.5 1.1-1.9 1.9-.1.2 0 .4.2.4.5-.2 1.1-.3 1.7-.3 1.8 0 3.5.5 4.9 1.4.7.5 1.3 1.1 1.7 1.8.1.2.3.3.5.2.3-.2.5-.5.6-.8.2-.8 0-1.6-.5-2.3-.3-.6-.8-1.1-1.4-1.5zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z' />
                        </svg>
                    </div>
                );
            case 'kubernetes':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M10.204 14.35l.007.01-.999 2.413a5.171 5.171 0 002.778-2.413zm-2.41-5.404l2.414.999a5.171 5.171 0 00-2.414-2.778zm5.404-2.41l-.999 2.413a5.171 5.171 0 002.413-2.778zm2.41 5.404l-2.413-.999a5.171 5.171 0 002.778 2.413zm-8.588.16l.991-.991a4.171 4.171 0 00-.991.991zm10.578 0a4.171 4.171 0 00-.991-.991l.991.991zm-9.587 1.991l.991.991a4.171 4.171 0 00-.991-.991zm8.597 0a4.171 4.171 0 00.991.991l-.991-.991zM12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm0-10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' />
                    </svg>
                );
            case 'azure':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M5.483 21.3H24L18.239 0h-5.924l-6.832 21.3zM0 21.3h11.169L9.711 17.054H2.542L0 21.3z' />
                    </svg>
                );
            case 'sonarqube':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M15.685.386l-.465.766c3.477 2.112 6.305 5.21 7.966 8.733l.016-.006L24 12.063c-1.78-4.311-5.147-8.052-9.514-10.856L15.685.386zM8.541 1.995l-.93 1.22c2.636 2.01 4.803 4.657 6.289 7.664l.01-.006 1.397 2.177c-1.661-3.683-4.178-6.988-7.366-9.676L8.541 1.995zM.913 9.148l.914 1.23c.616.827 1.326 1.603 2.113 2.313l-.007.01 1.314 2.046c-1.145-.889-2.179-1.919-3.073-3.068L.913 9.148zM12 7.351c1.113 0 2.015.903 2.015 2.015s-.902 2.015-2.015 2.015-2.015-.903-2.015-2.015S10.887 7.351 12 7.351zm-7.464 5.952L6.85 15.35c-.615-.482-1.076-1.098-1.314-1.797l-.003.001L4.536 13.303zm4.132-.318l2.314 3.6c-.376-.047-.756-.129-1.126-.249l-.004.002-1.226-1.91-.009.005c-.295-.436-.631-.84-1.008-1.209l1.059-1.239zm7.084 1.458l1.388 2.162c-.702.451-1.474.799-2.293.999l.004.007-1.199-1.868c.821-.27 1.587-.7 2.253-1.286l-.153-.014z' />
                    </svg>
                );
            case 'jest':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M22.251 11.82a3.117 3.117 0 0 0-2.328-3.01L22.911 0H8.104L11.092 8.81a3.116 3.116 0 0 0-2.244 2.988c0 1.726 1.402 3.127 3.127 3.127.945 0 1.891-.413 2.54-1.128.649.715 1.595 1.128 2.54 1.128 1.726 0 3.127-1.401 3.127-3.127 0-.095-.007-.189-.02-.283.014-.03.021-.061.021-.092a3.064 3.064 0 0 0-.032-.595zM15.502 12.898c-.559 0-1.01-.451-1.01-1.01s.451-1.01 1.01-1.01 1.01.451 1.01 1.01-.45 1.01-1.01 1.01zm-3.007 0c-.559 0-1.01-.451-1.01-1.01s.451-1.01 1.01-1.01 1.01.451 1.01 1.01-.451 1.01-1.01 1.01z' />
                    </svg>
                );
            case 'cypress':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M11.998 0C5.366 0 0 5.367 0 12a11.992 11.992 0 0 0 12 12c6.633 0 12-5.367 12-12-.001-6.633-5.412-12-12.002-12zM6.37 14.575c.392.523.916.742 1.657.742.35 0 .699-.044 1.004-.175.306-.13.567-.306.742-.567l1.004 1.572c-.611.654-1.69 1.26-2.882 1.26-1.787 0-3.276-.742-4.236-2.26C2.698 14.49 2.306 13.36 2.306 12c0-1.36.392-2.49 1.353-4.147.96-1.518 2.45-2.26 4.236-2.26 1.192 0 2.27.606 2.882 1.26l-1.004 1.572c-.175-.261-.436-.437-.742-.567-.305-.131-.654-.175-1.004-.175-.741 0-1.265.218-1.657.742-.523.698-.829 1.657-.829 2.575.043 1.048.306 1.877.829 2.575zm5.194 2.619c-.741 0-1.353-.218-1.831-.654-.479-.436-.719-1.004-.719-1.746 0-.741.24-1.31.719-1.746.478-.436 1.09-.654 1.831-.654.742 0 1.353.218 1.832.654.478.436.718 1.005.718 1.746 0 .742-.24 1.31-.718 1.746-.479.436-1.09.654-1.832.654zm0-1.441c.35 0 .567-.13.698-.305.13-.218.174-.479.174-.829s-.043-.611-.174-.829c-.131-.175-.348-.305-.698-.305-.349 0-.567.13-.698.305-.131.218-.175.479-.175.829s.044.611.175.829c.131.175.349.305.698.305z' />
                    </svg>
                );
            case 'selenium':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c6.628 0 12-5.372 12-12S18.628 0 12 0zm-.84 4.368c1.891 0 3.527.684 4.909 2.052.265.265.53.607.795 1.026l-2.25 1.539c-.189-.342-.379-.608-.57-.798-.721-.684-1.558-1.026-2.51-1.026-1.064 0-1.939.342-2.625 1.026-.686.684-1.029 1.52-1.029 2.508 0 .988.343 1.824 1.029 2.508.686.684 1.561 1.026 2.625 1.026.952 0 1.789-.342 2.51-1.026.191-.19.381-.456.57-.798l2.25 1.539c-.265.419-.53.761-.795 1.026-1.382 1.368-3.018 2.052-4.909 2.052-1.891 0-3.527-.684-4.909-2.052C5.684 15.527 5 13.891 5 12c0-1.891.684-3.527 2.052-4.909C8.434 5.709 10.07 5.025 11.961 5.025z' />
                    </svg>
                );
            case 'gcp':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M12.19 2.38a9.344 9.344 0 0 1 6.67 2.77l-3.54 3.54c-.8-.75-1.85-1.18-2.96-1.18a4.77 4.77 0 0 0-4.77 4.77c0 1.11.43 2.16 1.18 2.96l-3.54 3.54a9.344 9.344 0 0 1-2.77-6.67 9.58 9.58 0 0 1 9.63-9.63z' />
                        <path d='M21.62 12.19c0-.62-.06-1.23-.16-1.81H12v3.43h5.39c-.23 1.25-.93 2.31-1.97 3.02v2.51h3.18c1.86-1.71 2.93-4.23 2.93-7.15z' />
                        <path d='M12 22c2.58 0 4.74-.85 6.32-2.31l-3.09-2.4c-.86.58-1.96.92-3.23.92a5.51 5.51 0 0 1-5.18-3.58H3.64v2.47A9.58 9.58 0 0 0 12 22z' />
                        <path d='M6.82 14.63c-.19-.58-.3-1.2-.3-1.82s.11-1.24.3-1.82V8.52H3.64a9.58 9.58 0 0 0 0 8.58l3.18-2.47z' />
                    </svg>
                );
            case 'azure-boards':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M3 3h18v3H3V3zm0 5h18v3H3V8zm0 5h18v3H3v-3zm0 5h18v3H3v-3z' />
                    </svg>
                );
            case 'azure-repos':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                    </svg>
                );
            case 'azure-pipelines':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M5.483 21.3H24L18.239 0h-5.924l-6.832 21.3zM0 21.3h11.169L9.711 17.054H2.542L0 21.3z' />
                    </svg>
                );
            case 'github-actions':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 2.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C19.438 21.8 24 17.302 24 12c0-6.627-5.373-12-12-12z' />
                        <circle cx='12' cy='12' r='3' fill='#000' />
                    </svg>
                );
            case 'gitlab-ci':
                return (
                    <svg
                        className='w-4 h-4'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                    >
                        <path d='M12 21.42l-8.21-6.08h16.42L12 21.42zM2.58 9.58L12 21.42l-9.42-6.84-.5-5zm18.84 0L12 21.42l9.42-6.84.5-5zM12 2.58l3.42 7H8.58l3.42-7z' />
                    </svg>
                );
            default:
                // Enhanced fallback icons for specific tools
                // Node environment tools
                if (tool.id === 'dev') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'qa') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'production') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'custom') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z' />
                            </svg>
                        </div>
                    );
                }
                // Approval tools
                if (tool.id === 'manual-approval') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'automated-gate') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'security-scan') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 1l3.09 6.26L22 9l-5 4.87L18.18 21 12 17.77 5.82 21 7 13.87 2 9l6.91-1.74L12 1z' />
                            </svg>
                        </div>
                    );
                }
                // Release tools
                if (tool.id === 'release-notes') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'tag-release') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M21.41 11.41l-8.83-8.83c-.37-.37-.88-.58-1.41-.58H4c-1.1 0-2 .9-2 2v7.17c0 .53.21 1.04.59 1.41l8.83 8.83c.78.78 2.05.78 2.83 0l7.17-7.17c.78-.78.78-2.04-.01-2.83zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5 8 5.67 8 6.5 7.33 8 6.5 8z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'deploy-prod') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                            </svg>
                        </div>
                    );
                }
                // Additional testing tools
                if (tool.id === 'sonarqube') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm5-11h-4V7h4v4zm-6 2H7v4h4v-4z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'selenium') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm0-18c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8z' />
                            </svg>
                        </div>
                    );
                }
                // Additional project management tools
                if (tool.id === 'azure-boards') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M0 0v24h24V0H0zm22 22H2V2h20v20zM4 4v16h16V4H4zm14 14H6V6h12v12z' />
                            </svg>
                        </div>
                    );
                }
                // Build tools
                if (tool.id === 'github-actions') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-gray-800 to-black rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 2.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 5.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'azure-pipelines') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M24 12a12 12 0 11-24 0 12 12 0 0124 0zm-6 0a6 6 0 11-12 0 6 6 0 0112 0z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'azure-repos') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M0 10.5l6.75-6.75v4.5h9.75v4.5H6.75v4.5L0 10.5z M15 12.75l6.75-6.75v4.5h1.5v4.5h-1.5v4.5L15 12.75z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'jira') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12.4 3.8h-.8c-3.7 0-6.7 3-6.7 6.7v.8c0 .4.3.7.7.7h.8c3.7 0 6.7-3 6.7-6.7v-.8c0-.4-.3-.7-.7-.7zm0 9.6h-.8c-3.7 0-6.7 3-6.7 6.7v.2c0 .4.3.7.7.7h.8c3.7 0 6.7-3 6.7-6.7v-.2c0-.4-.3-.7-.7-.7z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'trello') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M21 0H3a3 3 0 00-3 3v18a3 3 0 003 3h18a3 3 0 003-3V3a3 3 0 00-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.645-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v12.36zm9.96-6.84c0 .795-.645 1.44-1.44 1.44H14.52c-.795 0-1.44-.645-1.44-1.44V5.82c0-.795.645-1.44 1.44-1.44H19c.795 0 1.44.645 1.44 1.44v5.52z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'jest') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M22.5 9.5h-1.4c-.3-2.2-1.8-4-3.8-4.8L19 2.5c.1-.2 0-.5-.2-.6s-.5 0-.6.2l-1.7 2.2c-.7-.2-1.4-.3-2.2-.3s-1.5.1-2.2.3L10.4 2.1c-.1-.2-.4-.3-.6-.2s-.3.4-.2.6l1.7 2.2c-2 .8-3.5 2.6-3.8 4.8H6.1c-.3 0-.5.2-.5.5s.2.5.5.5h1.4v3c0 .3.2.5.5.5s.5-.2.5-.5v-3h8v3c0 .3.2.5.5.5s.5-.2.5-.5v-3h1.4c.3 0 .5-.2.5-.5s-.2-.5-.5-.5zm-8 1c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm3 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'cypress') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm-.5 19.5c-4.1 0-7.5-3.4-7.5-7.5s3.4-7.5 7.5-7.5 7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5zm0-13c-3 0-5.5 2.5-5.5 5.5s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5-2.5-5.5-5.5-5.5zm0 9c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'bitbucket') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.499.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z' />
                            </svg>
                        </div>
                    );
                }
                if (tool.id === 'kubernetes') {
                    return (
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-1.5 shadow-md'>
                            <svg
                                className='w-full h-full'
                                viewBox='0 0 24 24'
                                fill='white'
                            >
                                <path d='M12 2l1.5 1.5L12 5 10.5 3.5 12 2zm0 20l-1.5-1.5L12 19l1.5 1.5L12 22zm10-10l-1.5-1.5L19 12l1.5 1.5L22 12zM2 12l1.5 1.5L5 12 3.5 10.5 2 12zm2.8-7.2L6.2 6.2 4.8 7.6 3.4 6.2l1.4-1.4zm14.4 14.4l-1.4-1.4 1.4-1.4 1.4 1.4-1.4 1.4zm0-14.4L17.8 6.2 16.4 4.8l1.4-1.4 1.4 1.4zM4.8 19.2l1.4-1.4 1.4 1.4-1.4 1.4-1.4-1.4z' />
                            </svg>
                        </div>
                    );
                }

                // Default enhanced fallback
                return (
                    <div className='w-8 h-8 bg-gradient-to-br from-sap-blue to-sap-dark-blue rounded-lg flex items-center justify-center shadow-md'>
                        <span className='text-white text-xs font-bold'>
                            {tool.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                );
        }
    };

    return <div className='text-sap-gray'>{getIcon()}</div>;
};

const toolCategories: ToolCategory[] = [
    {
        id: 'nodes',
        name: 'Nodes',
        icon: (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
            </svg>
        ),
        tools: [
            {id: 'dev', name: 'DEV', icon: '', nodeType: 'node_dev'},
            {id: 'qa', name: 'QA', icon: '', nodeType: 'node_qa'},
            {
                id: 'production',
                name: 'Production',
                icon: '',
                nodeType: 'node_prod',
            },
            {id: 'custom', name: 'Custom', icon: '', nodeType: 'code_github'},
        ],
    },
    {
        id: 'plan',
        name: 'Plan',
        icon: (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
            </svg>
        ),
        tools: [
            {id: 'jira', name: 'JIRA', icon: '', nodeType: 'plan_jira'},
            {
                id: 'azure-boards',
                name: 'Azure Boards',
                icon: '',
                nodeType: 'plan_asana',
            },
            {id: 'trello', name: 'Trello', icon: '', nodeType: 'plan_trello'},
        ],
    },
    {
        id: 'code',
        name: 'Code',
        icon: (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M13.325 3.05L8.667 20.432c-.171.635.334 1.154.995.995l17.382-4.658c.662-.178.927-.928.529-1.529L16.856 3.579c-.398-.6-1.148-.335-1.529.529L13.325 3.05z' />
            </svg>
        ),
        tools: [
            {id: 'github', name: 'GitHub', icon: '', nodeType: 'code_github'},
            {id: 'gitlab', name: 'GitLab', icon: '', nodeType: 'code_gitlab'},
            {
                id: 'bitbucket',
                name: 'Bitbucket',
                icon: '',
                nodeType: 'code_bitbucket',
            },
            {
                id: 'azure-repos',
                name: 'Azure Repos',
                icon: '',
                nodeType: 'code_github',
            },
        ],
    },
    {
        id: 'test',
        name: 'Test',
        icon: (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' />
            </svg>
        ),
        tools: [
            {
                id: 'sonarqube',
                name: 'SonarQube',
                icon: '',
                nodeType: 'test_jest',
            },
            {id: 'jest', name: 'Jest', icon: '', nodeType: 'test_jest'},
            {
                id: 'cypress',
                name: 'Cypress',
                icon: '',
                nodeType: 'test_cypress',
            },
            {
                id: 'selenium',
                name: 'Selenium',
                icon: '',
                nodeType: 'test_selenium',
            },
        ],
    },
    {
        id: 'build',
        name: 'Build',
        icon: (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z' />
            </svg>
        ),
        tools: [
            {
                id: 'jenkins',
                name: 'Jenkins',
                icon: '',
                nodeType: 'build_jenkins',
            },
            {
                id: 'azure-pipelines',
                name: 'Azure Pipelines',
                icon: '',
                nodeType: 'build_azure_devops',
            },
            {
                id: 'github-actions',
                name: 'GitHub Actions',
                icon: '',
                nodeType: 'build_github_actions',
            },
            {
                id: 'gitlab-ci',
                name: 'GitLab CI',
                icon: '',
                nodeType: 'build_jenkins',
            },
        ],
    },
    {
        id: 'deploy',
        name: 'Deploy',
        icon: (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
            </svg>
        ),
        tools: [
            {
                id: 'aws',
                name: 'AWS',
                icon: '',
                nodeType: 'deploy_aws_codepipeline',
            },
            {
                id: 'azure',
                name: 'Azure',
                icon: '',
                nodeType: 'deploy_cloudfoundry',
            },
            {id: 'gcp', name: 'GCP', icon: '', nodeType: 'deploy_terraform'},
            {
                id: 'docker',
                name: 'Docker',
                icon: '',
                nodeType: 'deploy_docker',
            },
            {
                id: 'kubernetes',
                name: 'Kubernetes',
                icon: '',
                nodeType: 'deploy_kubernetes',
            },
        ],
    },
    {
        id: 'approval',
        name: 'Approval Task',
        icon: (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
        ),
        tools: [
            {
                id: 'manual-approval',
                name: 'Manual Approval',
                icon: '',
                nodeType: 'approval_manual',
            },
            {
                id: 'automated-gate',
                name: 'Automated Gate',
                icon: '',
                nodeType: 'approval_teams',
            },
            {
                id: 'security-scan',
                name: 'Security Scan',
                icon: '',
                nodeType: 'approval_slack',
            },
        ],
    },
    {
        id: 'release',
        name: 'Release',
        icon: (
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M20 6L9 17l-5-5' />
            </svg>
        ),
        tools: [
            {
                id: 'release-notes',
                name: 'Release Notes',
                icon: '',
                nodeType: 'release_argo_cd',
            },
            {
                id: 'tag-release',
                name: 'Tag Release',
                icon: '',
                nodeType: 'code_github',
            },
            {
                id: 'deploy-prod',
                name: 'Deploy Production',
                icon: '',
                nodeType: 'deploy_kubernetes',
            },
        ],
    },
];

interface ToolSidebarProps {
    onDragStart: (
        event: React.DragEvent,
        nodeType: WorkflowNodeType,
        toolName?: string,
    ) => void;
}

export default function ToolSidebar({onDragStart}: ToolSidebarProps) {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customNodeName, setCustomNodeName] = useState('');
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(
        null,
    );
    const [isAnimating, setIsAnimating] = useState(false);

    const handleCustomNodeCreate = () => {
        if (customNodeName.trim()) {
            // Add logic to create custom node
            console.log('Creating custom node:', customNodeName);
            setCustomNodeName('');
            closeCustomInput();
        }
    };

    const closeCustomInput = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setShowCustomInput(false);
            setIsAnimating(false);
        }, 300); // Match animation duration
    };

    const handleMouseEnter = (categoryId: string) => {
        // Clear any existing timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        setHoveredCategory(categoryId);
    };

    const handleMouseLeave = () => {
        // Add a delay before hiding the popup
        const timeout = setTimeout(() => {
            setHoveredCategory(null);
        }, 300); // 300ms delay
        setHoverTimeout(timeout);
    };

    const handlePopupMouseEnter = () => {
        // Clear timeout when mouse enters the popup
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }
    };

    const handlePopupMouseLeave = () => {
        // Hide popup when mouse leaves the popup area
        setHoveredCategory(null);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
            }
        };
    }, [hoverTimeout]);

    return (
        <div className='w-20 bg-gradient-to-b from-sap-light-gray via-white to-sap-light-blue/30 border-r-2 border-sap-blue/30 flex flex-col overflow-visible relative shadow-xl'>
            {/* Top accent bar */}
            <div className='h-1 bg-gradient-to-r from-sap-blue to-sap-dark-blue'></div>

            {/* Sidebar Categories */}
            <div className='flex flex-col space-y-2 p-2'>
                {toolCategories.map((category) => (
                    <div
                        key={category.id}
                        className='relative'
                        onMouseEnter={() => handleMouseEnter(category.id)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Category Icon */}
                        <div className='w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-500 hover:to-blue-600 border-2 border-blue-300 hover:border-blue-500 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105'>
                            <div
                                className='text-blue-600 group-hover:text-white transition-colors duration-300'
                                title={category.name}
                            >
                                {category.icon}
                            </div>
                        </div>

                        {/* Hover Popup */}
                        {hoveredCategory === category.id && (
                            <div
                                className='absolute left-20 top-0 z-60 bg-white border-2 border-sap-blue/20 rounded-xl shadow-2xl p-5 min-w-[280px] animate-slideIn backdrop-blur-sm'
                                onMouseEnter={handlePopupMouseEnter}
                                onMouseLeave={handlePopupMouseLeave}
                            >
                                <h3 className='font-bold text-sap-dark-blue mb-4 border-b-2 border-sap-blue/20 pb-3 text-lg'>
                                    {category.name}
                                </h3>
                                <div className='grid grid-cols-2 gap-3'>
                                    {category.tools.map((tool) => (
                                        <div
                                            key={tool.id}
                                            className='flex flex-col items-center gap-2 p-3 hover:bg-sap-light-blue rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 border border-transparent hover:border-sap-blue/30'
                                            draggable
                                            onDragStart={(e) => {
                                                if (tool.id === 'custom') {
                                                    setShowCustomInput(true);
                                                    e.preventDefault();
                                                } else {
                                                    onDragStart(
                                                        e,
                                                        tool.nodeType,
                                                        tool.name,
                                                    );
                                                }
                                            }}
                                            onClick={(e) => {
                                                // Alternative to drag: click to add tool
                                                if (tool.id === 'custom') {
                                                    setShowCustomInput(true);
                                                } else {
                                                    // Create a synthetic drag event for click-to-add
                                                    const syntheticEvent = {
                                                        ...e,
                                                        dataTransfer: {
                                                            setData: () => {},
                                                            effectAllowed:
                                                                'copy',
                                                        },
                                                    } as any;
                                                    onDragStart(
                                                        syntheticEvent,
                                                        tool.nodeType,
                                                        tool.name,
                                                    );
                                                }
                                            }}
                                        >
                                            <div className='flex items-center justify-center'>
                                                <ToolIcon tool={tool} />
                                            </div>
                                            <span className='text-xs font-semibold text-sap-dark-blue text-center leading-tight'>
                                                {tool.name}
                                            </span>
                                            <div className='absolute top-1 right-1 text-xs text-sap-blue opacity-60'>
                                                ⋮⋮
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Custom Node Input Modal - Sliding from left */}
            {showCustomInput && (
                <>
                    {/* Background overlay */}
                    <div
                        className='fixed inset-0 bg-black bg-opacity-30 z-40'
                        onClick={() => {
                            closeCustomInput();
                            setCustomNodeName('');
                        }}
                    />

                    {/* Sliding panel */}
                    <div className='absolute left-16 top-1/2 transform -translate-y-1/2 z-50'>
                        <div
                            className={`bg-white rounded-lg shadow-lg border border-sap-border p-4 w-80 ${
                                showCustomInput && !isAnimating
                                    ? 'animate-slideInFromLeft'
                                    : isAnimating
                                    ? 'animate-slideOutToLeft'
                                    : 'opacity-0 -translate-x-full'
                            }`}
                        >
                            <div className='flex items-center justify-between mb-3'>
                                <h3 className='text-lg font-semibold text-sap-dark-gray'>
                                    Create Custom Node
                                </h3>
                                <button
                                    onClick={() => {
                                        closeCustomInput();
                                        setCustomNodeName('');
                                    }}
                                    className='text-sap-gray hover:text-sap-dark-gray text-lg'
                                >
                                    ×
                                </button>
                            </div>

                            <input
                                type='text'
                                value={customNodeName}
                                onChange={(e) =>
                                    setCustomNodeName(e.target.value)
                                }
                                placeholder='Enter custom node name...'
                                className='w-full p-3 border border-sap-border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sap-blue text-sm'
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCustomNodeCreate();
                                    } else if (e.key === 'Escape') {
                                        closeCustomInput();
                                        setCustomNodeName('');
                                    }
                                }}
                            />

                            <div className='flex space-x-3'>
                                <button
                                    onClick={handleCustomNodeCreate}
                                    className='flex-1 px-4 py-2 bg-sap-blue text-white rounded-lg hover:bg-sap-dark-blue transition-colors text-sm font-medium'
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => {
                                        closeCustomInput();
                                        setCustomNodeName('');
                                    }}
                                    className='flex-1 px-4 py-2 bg-sap-light-gray text-sap-dark-gray rounded-lg hover:bg-sap-gray hover:text-white transition-colors text-sm font-medium'
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideInFromLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideOutToLeft {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-100%);
                    }
                }

                .animate-slideIn {
                    animation: slideIn 0.2s ease-out;
                }

                .animate-slideInFromLeft {
                    animation: slideInFromLeft 0.3s ease-out forwards;
                }

                .animate-slideOutToLeft {
                    animation: slideOutToLeft 0.3s ease-in forwards;
                }
            `}</style>
        </div>
    );
}
