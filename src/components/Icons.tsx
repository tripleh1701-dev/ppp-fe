'use client';

import React from 'react';

// Fallback to inline SVGs but prefer official assets from /public/images/logos when available
const ImgIcon = ({
    src,
    alt,
    size = 24,
    className = '',
}: {
    src: string;
    alt: string;
    size?: number;
    className?: string;
}) => (
    <img src={src} alt={alt} width={size} height={size} className={className} />
);

interface IconProps {
    className?: string;
    size?: number;
}

// Realistic Git Logo
export const GitIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path
            d='M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.327 2.341l2.66 2.66a1.838 1.838 0 1 1-.981.98l-2.48-2.48v6.529a1.838 1.838 0 1 1-1.838 0V8.539a1.838 1.838 0 0 1-.999-2.405L7.396 3.373.452 10.317a1.55 1.55 0 0 0 0 2.188L10.93 23.546a1.55 1.55 0 0 0 2.188 0L23.546 13.12a1.55 1.55 0 0 0 0-2.188z'
            fill='#F1502F'
        />
    </svg>
);

// GitHub Logo
export const GitHubIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/github.svg'
        alt='GitHub'
        size={size}
        className={className}
    />
);

// GitLab Logo
export const GitLabIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path d='M12 21.42l3.684-11.333H8.316L12 21.42z' fill='#E24329' />
        <path d='M12 21.42l-3.684-11.333H1.858L12 21.42z' fill='#FC6D26' />
        <path
            d='M1.858 10.087L.328 14.58c-.133.41.015.865.356 1.154L12 21.42 1.858 10.087z'
            fill='#FCA326'
        />
        <path
            d='M1.858 10.087h6.458L6.441.93C6.169.265 5.327.265 5.055.93L1.858 10.087z'
            fill='#E24329'
        />
        <path d='M12 21.42l3.684-11.333h6.458L12 21.42z' fill='#FC6D26' />
        <path
            d='M22.142 10.087L23.672 14.58c.133.41-.015.865-.356 1.154L12 21.42l10.142-11.333z'
            fill='#FCA326'
        />
        <path
            d='M22.142 10.087h-6.458L17.559.93c.272-.665 1.114-.665 1.386 0l3.197 9.157z'
            fill='#E24329'
        />
    </svg>
);

// Realistic Jira Logo
export const JiraIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/jira.svg'
        alt='Jira'
        size={size}
        className={className}
    />
);

// Trello Logo
export const TrelloIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <rect x='2' y='2' width='20' height='20' rx='3' fill='#0079BF' />
        <rect x='5' y='5' width='5' height='10' rx='1' fill='white' />
        <rect x='14' y='5' width='5' height='6' rx='1' fill='white' />
    </svg>
);

// Asana Logo
export const AsanaIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <circle cx='8' cy='8' r='4' fill='#F06A6A' />
        <circle cx='16' cy='8' r='4' fill='#F06A6A' />
        <circle cx='12' cy='16' r='4' fill='#F06A6A' />
    </svg>
);

// Realistic Bitbucket Logo
export const BitbucketIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='bitbucket-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#0052CC' />
                <stop offset='100%' stopColor='#2684FF' />
            </linearGradient>
        </defs>
        <path
            d='M1.679 2.75a.75.75 0 0 0-.748.83l3.064 17.9a1.25 1.25 0 0 0 1.245 1.07h13.52a.75.75 0 0 0 .748-.83L22.069 3.58a.75.75 0 0 0-.748-.83H1.679z'
            fill='url(#bitbucket-gradient)'
        />
        <path d='M14.5 14h-5l-.8-5h6.6l-.8 5z' fill='#FFF' />
        <ellipse cx='12' cy='6.5' rx='1' ry='0.8' fill='#FFF' opacity='0.8' />
    </svg>
);

// Realistic Jenkins Logo
export const JenkinsIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <radialGradient id='jenkins-gradient' cx='50%' cy='30%' r='70%'>
                <stop offset='0%' stopColor='#F8F8F8' />
                <stop offset='100%' stopColor='#D4E1F1' />
            </radialGradient>
        </defs>
        <circle
            cx='12'
            cy='12'
            r='11'
            fill='url(#jenkins-gradient)'
            stroke='#335061'
            strokeWidth='1'
        />
        <circle cx='12' cy='12' r='8' fill='#FFF' />
        <path
            d='M12 6c-1 0-2 .5-2.5 1.5-.3.6-.5 1.2-.5 2 0 1 .5 2 1.5 2.5.5.3 1 .5 1.5.5s1-.2 1.5-.5c1-.5 1.5-1.5 1.5-2.5 0-.8-.2-1.4-.5-2C14 6.5 13 6 12 6z'
            fill='#335061'
        />
        <circle cx='10.5' cy='9' r='0.8' fill='#FFF' />
        <circle cx='13.5' cy='9' r='0.8' fill='#FFF' />
        <path d='M10.5 13h3c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5z' fill='#FFF' />
        <path
            d='M12 18c-.5 0-1-.2-1.5-.5-1-.5-1.5-1.5-1.5-2.5h6c0 1-.5 2-1.5 2.5-.5.3-1 .5-1.5.5z'
            fill='#D33833'
        />
    </svg>
);

// Kubernetes Logo
export const KubernetesIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path
            d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
            stroke='#326CE5'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
        />
        <circle cx='12' cy='7' r='1' fill='#326CE5' />
        <circle cx='12' cy='12' r='1' fill='#326CE5' />
        <circle cx='12' cy='17' r='1' fill='#326CE5' />
    </svg>
);

// Helm Logo
export const HelmIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path
            d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'
            stroke='#0F1689'
            strokeWidth='1.5'
            fill='#0F1689'
            fillOpacity='0.1'
        />
        <path
            d='M12 7v10M8 9l8 6M16 9l-8 6'
            stroke='#0F1689'
            strokeWidth='1.5'
            strokeLinecap='round'
        />
    </svg>
);

// Jest Logo
export const JestIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path d='M12 0L8.5 8h7L12 0z' fill='#C21325' />
        <circle cx='8.5' cy='16' r='4' fill='#C21325' />
        <circle cx='15.5' cy='16' r='4' fill='#C21325' />
        <path d='M8.5 12v8M15.5 12v8' stroke='#C21325' strokeWidth='2' />
    </svg>
);

// Cypress Logo
export const CypressIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <circle cx='12' cy='12' r='10' fill='#17202C' />
        <circle
            cx='12'
            cy='12'
            r='6'
            fill='none'
            stroke='white'
            strokeWidth='2'
        />
        <circle cx='12' cy='12' r='2' fill='white' />
    </svg>
);

// Realistic Selenium Logo
export const SeleniumIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='selenium-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#43B02A' />
                <stop offset='100%' stopColor='#2E7D20' />
            </linearGradient>
        </defs>
        <rect
            x='2'
            y='2'
            width='20'
            height='20'
            rx='4'
            fill='url(#selenium-gradient)'
        />
        <circle
            cx='12'
            cy='12'
            r='8'
            fill='none'
            stroke='#FFF'
            strokeWidth='2'
        />
        <circle cx='12' cy='12' r='4' fill='#FFF' />
        <circle cx='12' cy='12' r='2' fill='#43B02A' />
        <path
            d='M12 4v2m0 12v2m8-8h-2m-12 0H4'
            stroke='#FFF'
            strokeWidth='1.5'
            strokeLinecap='round'
        />
        <path
            d='M17.5 6.5l-1.4 1.4m-8.2 8.2l-1.4 1.4m0-11.6l1.4 1.4m8.2 8.2l1.4 1.4'
            stroke='#FFF'
            strokeWidth='1'
            strokeLinecap='round'
        />
    </svg>
);

// Realistic AWS Logo
export const AWSIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/aws.svg'
        alt='AWS'
        size={size}
        className={className}
    />
);

// Google Cloud Logo
export const GoogleCloudIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path
            d='M12 3a9 9 0 017.48 4.02l-2.26 2.26A5.98 5.98 0 0012 7a6 6 0 00-5.22 2.98L4.52 7.02A9 9 0 0112 3z'
            fill='#4285F4'
        />
        <path
            d='M21 12a9 9 0 01-.52 3.02l-2.26-2.26A5.98 5.98 0 0018 12a6 6 0 00-.22-1.02l2.26-2.26A9 9 0 0121 12z'
            fill='#34A853'
        />
        <path
            d='M3 12a9 9 0 01.52-3.02l2.26 2.26A5.98 5.98 0 006 12a6 6 0 00.22 1.02L3.52 15.02A9 9 0 013 12z'
            fill='#FBBC05'
        />
        <path
            d='M12 21a9 9 0 01-7.48-4.02l2.26-2.26A5.98 5.98 0 0012 17a6 6 0 005.22-2.98l2.26 2.26A9 9 0 0112 21z'
            fill='#EA4335'
        />
    </svg>
);

// Azure Logo
export const AzureIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path d='M8.5 3L3 18h5.5l8-12-8-3z' fill='#0078D4' />
        <path d='M13.5 9L21 18H8.5l5-9z' fill='#00BCF2' />
    </svg>
);

// Realistic Slack Logo
export const SlackIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <rect x='2' y='2' width='20' height='20' rx='5' fill='#4A154B' />
        <g transform='translate(4.5, 4.5)'>
            <rect x='0' y='5' width='3' height='7' rx='1.5' fill='#E01E5A' />
            <rect x='5' y='0' width='7' height='3' rx='1.5' fill='#36C5F0' />
            <rect x='12' y='5' width='3' height='7' rx='1.5' fill='#2EB67D' />
            <rect x='5' y='12' width='7' height='3' rx='1.5' fill='#ECB22E' />
            <circle cx='7.5' cy='7.5' r='1.5' fill='#FFF' />
        </g>
    </svg>
);

// Realistic Docker Logo
export const DockerIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='docker-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#2496ED' />
                <stop offset='100%' stopColor='#0073E6' />
            </linearGradient>
        </defs>
        <rect
            x='2'
            y='2'
            width='20'
            height='20'
            rx='3'
            fill='url(#docker-gradient)'
        />
        <g transform='translate(3, 6)'>
            <rect x='0' y='3' width='2' height='2' rx='0.2' fill='#FFF' />
            <rect x='3' y='3' width='2' height='2' rx='0.2' fill='#FFF' />
            <rect x='6' y='3' width='2' height='2' rx='0.2' fill='#FFF' />
            <rect x='9' y='3' width='2' height='2' rx='0.2' fill='#FFF' />
            <rect x='12' y='3' width='2' height='2' rx='0.2' fill='#FFF' />
            <rect x='3' y='0' width='2' height='2' rx='0.2' fill='#FFF' />
            <rect x='6' y='0' width='2' height='2' rx='0.2' fill='#FFF' />
            <rect x='6' y='6' width='2' height='2' rx='0.2' fill='#FFF' />
            <ellipse cx='16' cy='2' rx='2' ry='1' fill='#FFF' />
        </g>
    </svg>
);

// NPM Logo
export const NpmIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <rect x='2' y='8' width='20' height='8' fill='#CB3837' />
        <rect x='4' y='10' width='2' height='4' fill='white' />
        <rect x='8' y='10' width='2' height='4' fill='white' />
        <rect x='12' y='10' width='2' height='2' fill='white' />
        <rect x='16' y='10' width='2' height='4' fill='white' />
        <rect x='18' y='10' width='2' height='4' fill='white' />
    </svg>
);

// Maven Logo
export const MavenIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <rect x='2' y='2' width='20' height='20' rx='2' fill='#FF6B35' />
        <text
            x='12'
            y='15'
            textAnchor='middle'
            fontSize='10'
            fill='white'
            fontFamily='monospace'
        >
            M
        </text>
    </svg>
);

// ---------- App Shell / Navigation glyphs ----------
export const GridIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <rect x='3' y='3' width='7' height='7' rx='2' />
        <rect x='14' y='3' width='7' height='7' rx='2' />
        <rect x='3' y='14' width='7' height='7' rx='2' />
        <rect x='14' y='14' width='7' height='7' rx='2' />
    </svg>
);
export const MailIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <rect x='3' y='5' width='18' height='14' rx='2' />
        <path d='M3 7l9 6 9-6' />
    </svg>
);
export const ChartIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <path d='M4 19V5' />
        <path d='M4 19h16' />
        <rect x='7' y='11' width='3' height='5' rx='1' />
        <rect x='12' y='8' width='3' height='8' rx='1' />
        <rect x='17' y='6' width='3' height='10' rx='1' />
    </svg>
);
export const BoltIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='currentColor'
    >
        <path d='M13 2L3 14h7l-1 8 11-14h-7l1-6z' />
    </svg>
);
export const FlaskIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <path d='M9 3h6' />
        <path d='M10 3v5l-5 8a3 3 0 002.6 4.5h8.8A3 3 0 0019 16l-5-8V3' />
    </svg>
);
export const LockIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <rect x='5' y='11' width='14' height='9' rx='2' />
        <path d='M8 11V8a4 4 0 118 0v3' />
    </svg>
);
export const GearIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <circle cx='12' cy='12' r='3' />
        <path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.07a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82A1.65 1.65 0 013 12c0-.37.13-.72.36-1a1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 015.8 6.29l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V5a2 2 0 014 0v.07c0 .67.39 1.27 1 1.51h.32a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06c-.26.28-.36.63-.33 1A1.65 1.65 0 0121 12c0 .37-.13.72-.36 1z' />
    </svg>
);
export const HierarchyIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <circle cx='12' cy='5' r='2.5' />
        <path d='M12 8v4' />
        <circle cx='6' cy='17' r='2.5' />
        <circle cx='18' cy='17' r='2.5' />
        <path d='M6 15v-2a2 2 0 012-2h8a2 2 0 012 2v2' />
    </svg>
);
export const GlobeIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <circle cx='12' cy='12' r='9' />
        <path d='M3 12h18' />
        <path d='M12 3a15 15 0 010 18a15 15 0 010-18' />
    </svg>
);
export const ShieldIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <path d='M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z' />
        <path d='M9 12l2 2 4-4' />
    </svg>
);
export const TemplateIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        className={className}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
    >
        <rect x='3' y='4' width='18' height='16' rx='2' />
        <path d='M3 9h18' />
        <rect x='6' y='12' width='5' height='5' rx='1' />
    </svg>
);
// CircleCI Logo
export const CircleCIIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <circle cx='12' cy='12' r='10' fill='#161616' />
        <circle cx='12' cy='12' r='6' fill='white' />
        <circle cx='12' cy='12' r='2.6' fill='#161616' />
    </svg>
);

// SonarQube Logo
export const SonarQubeIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <rect x='2' y='2' width='20' height='20' rx='4' fill='#4C9BD6' />
        <path
            d='M5 16c3-4 8-6 14-6'
            stroke='white'
            strokeWidth='2'
            strokeLinecap='round'
        />
        <path
            d='M5 13c3-3 8-5 14-5'
            stroke='white'
            strokeWidth='1.5'
            strokeLinecap='round'
            opacity='0.8'
        />
        <path
            d='M5 10c3-2 8-4 14-4'
            stroke='white'
            strokeWidth='1.2'
            strokeLinecap='round'
            opacity='0.6'
        />
    </svg>
);

// Argo CD Logo (stylized)
export const ArgoIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <circle cx='12' cy='12' r='10' fill='#F26B35' />
        <circle cx='12' cy='9' r='3' fill='white' />
        <rect x='8' y='12' width='8' height='6' rx='3' fill='white' />
    </svg>
);

// Terraform Logo (stylized)
export const TerraformIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <g fill='#7B42BC'>
            <path d='M3 5l6 3.5v6L3 11V5z' />
            <path d='M10 8.5l6 3.5v6l-6-3.5v-6z' />
            <path d='M10 2l6 3.5v4L10 6V2z' />
        </g>
    </svg>
);

// Ansible Logo
export const AnsibleIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <circle cx='12' cy='12' r='10' fill='#000000' />
        <path
            d='M12 6l5 12h-2l-1.1-2.7H10l-1 2.7H7L12 6zm-0.8 7.3h3L12 9.7l-0.8 3.6z'
            fill='#FFFFFF'
        />
    </svg>
);

// Prometheus Logo (stylized)
export const PrometheusIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <circle cx='12' cy='12' r='10' fill='#E6522C' />
        <path
            d='M12 5l2 4-2 1-2-1 2-4zm0 6c2.2 0 4 1.8 4 4v2H8v-2c0-2.2 1.8-4 4-4z'
            fill='white'
        />
    </svg>
);

// Grafana Logo (stylized)
export const GrafanaIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <circle cx='12' cy='12' r='9' fill='#F46800' />
        <circle cx='12' cy='12' r='5' fill='#FFE6D1' />
        <path d='M12 3c3 2 5 3 7 6-2-1-4-1-7 0 1-3 1-4 0-6z' fill='#FFB155' />
    </svg>
);

// Azure DevOps (Boards/Pipelines) Logo (stylized)
export const AzureDevOpsIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <path d='M4 6l8-4 8 4v12l-8 4-8-4V6z' fill='#0078D4' />
        <path d='M8 8h8v8H8z' fill='white' />
    </svg>
);

// Google Cloud Build Logo (stylized)
export const CloudBuildIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <polygon points='12,2 22,7 22,17 12,22 2,17 2,7' fill='#4285F4' />
        <rect x='7' y='9' width='10' height='6' fill='white' />
    </svg>
);

// AWS CodePipeline (stylized)
export const CodePipelineIcon = ({className = '', size = 24}: IconProps) => (
    <svg width={size} height={size} viewBox='0 0 24 24' className={className}>
        <rect x='3' y='6' width='18' height='12' rx='2' fill='#FF9900' />
        <rect x='6' y='9' width='12' height='6' rx='1' fill='white' />
    </svg>
);

// Sparkles Icon
export const SparklesIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path
            d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
            fill='currentColor'
        />
        <path
            d='M7 14l-2 2 2 2'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M17 14l2 2-2 2'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// Chart Bar Icon
export const ChartBarIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path
            d='M3 3v18h18'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M18 17V9'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M13 17V5'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M8 17v-3'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// Wrench Icon
export const WrenchIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <path
            d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// Account/User Icon
export const AccountIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <circle
            cx='12'
            cy='8'
            r='3.2'
            stroke='currentColor'
            strokeWidth='2.4'
        />
        <path
            d='M5 19.2c0-3.2 3.134-5.2 7-5.2s7 2 7 5.2'
            stroke='currentColor'
            strokeWidth='2.4'
            strokeLinecap='round'
        />
    </svg>
);

// Users/People Icon
export const UsersIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <circle cx='12' cy='7' r='4' stroke='currentColor' strokeWidth='1.5' />
        <path
            d='M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
        />
    </svg>
);

// Enterprise/Building Icon
export const EnterpriseIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <rect
            x='3'
            y='6'
            width='8'
            height='14'
            rx='1.5'
            stroke='currentColor'
            strokeWidth='2.4'
        />
        <rect
            x='13'
            y='3'
            width='8'
            height='17'
            rx='1.5'
            stroke='currentColor'
            strokeWidth='2.4'
        />
        <path
            d='M5.5 9h3M5.5 12h3M5.5 15h3M15.5 6h3M15.5 9h3M15.5 12h3M15.5 15h3'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
        />
    </svg>
);

// Search Icon
export const SearchIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2' />
        <path
            d='m21 21-4.35-4.35'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// Kubernetes is available; Docker is available

interface IconComponentProps extends IconProps {
    name: string;
}

export const Icon = ({name, className = '', size = 24}: IconComponentProps) => {
    const icons: {[key: string]: React.ComponentType<IconProps>} = {
        git: GitIcon,
        github: GitHubIcon,
        gitlab: GitLabIcon,
        jira: JiraIcon,
        trello: TrelloIcon,
        asana: AsanaIcon,
        bitbucket: BitbucketIcon,
        jenkins: JenkinsIcon,
        kubernetes: KubernetesIcon,
        helm: HelmIcon,
        jest: JestIcon,
        cypress: CypressIcon,
        selenium: SeleniumIcon,
        aws: AWSIcon,
        gcp: GoogleCloudIcon,
        azure: AzureIcon,
        slack: SlackIcon,
        docker: DockerIcon,
        npm: NpmIcon,
        maven: MavenIcon,
        circleci: CircleCIIcon,
        sonarqube: SonarQubeIcon,
        argo: ArgoIcon,
        terraform: TerraformIcon,
        ansible: AnsibleIcon,
        prometheus: PrometheusIcon,
        grafana: GrafanaIcon,
        azdo: AzureDevOpsIcon,
        cloudbuild: CloudBuildIcon,
        codepipeline: CodePipelineIcon,
        sparkles: SparklesIcon,
        chartbar: ChartBarIcon,
        wrench: WrenchIcon,
        search: SearchIcon,
        account: AccountIcon,
        users: UsersIcon,
        enterprise: EnterpriseIcon,
        // Shell icons
        grid: GridIcon,
        mail: MailIcon,
        chart: ChartIcon,
        bolt: BoltIcon,
        flask: FlaskIcon,
        lock: LockIcon,
        gear: GearIcon,
        hierarchy: HierarchyIcon,
        globe: GlobeIcon,
        shield: ShieldIcon,
        template: TemplateIcon,
    };

    const IconComponent = icons[name];

    if (!IconComponent) {
        return (
            <div
                className={`bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center ${className}`}
                style={{width: size, height: size}}
            >
                <span className='text-xs text-gray-500 font-semibold'>
                    {name.charAt(0).toUpperCase()}
                </span>
            </div>
        );
    }

    return <IconComponent className={className} size={size} />;
};
