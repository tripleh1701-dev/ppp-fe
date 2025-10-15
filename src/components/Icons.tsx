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
    <ImgIcon
        src='/images/logos/gitlab.svg'
        alt='GitLab'
        size={size}
        className={className}
    />
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
    <ImgIcon
        src='/images/logos/trello.svg'
        alt='Trello'
        size={size}
        className={className}
    />
);

// Asana Logo
export const AsanaIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/asana.svg'
        alt='Asana'
        size={size}
        className={className}
    />
);

// Realistic Bitbucket Logo
export const BitbucketIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/bitbucket.svg'
        alt='Bitbucket'
        size={size}
        className={className}
    />
);

// Realistic Jenkins Logo
export const JenkinsIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/jenkins.svg'
        alt='Jenkins'
        size={size}
        className={className}
    />
);

// Kubernetes Logo
export const KubernetesIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/kubernetes.svg'
        alt='Kubernetes'
        size={size}
        className={className}
    />
);

// Helm Logo
export const HelmIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/helm.svg'
        alt='Helm'
        size={size}
        className={className}
    />
);

// Cloud Foundry Logo
export const CloudFoundryIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/cloudfoundry.svg'
        alt='Cloud Foundry'
        size={size}
        className={className}
    />
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
    <ImgIcon
        src='/images/logos/docker.svg'
        alt='Docker'
        size={size}
        className={className}
    />
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

// Travis CI Logo
export const TravisCIIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/travis_ci.svg'
        alt='Travis CI'
        size={size}
        className={className}
    />
);

// TeamCity Logo
export const TeamCityIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/teamcity.svg'
        alt='TeamCity'
        size={size}
        className={className}
    />
);

// Mocha Logo
export const MochaIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/mocha.svg'
        alt='Mocha'
        size={size}
        className={className}
    />
);

// Playwright Logo
export const PlaywrightIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/playwright.svg'
        alt='Playwright'
        size={size}
        className={className}
    />
);

// TestNG Logo
export const TestNGIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <rect x='3' y='3' width='18' height='18' rx='3' fill='#FF6B35' />
        <rect x='5' y='5' width='14' height='14' rx='2' fill='white' />
        <text
            x='12'
            y='16'
            textAnchor='middle'
            fontSize='10'
            fontWeight='bold'
            fill='#FF6B35'
        >
            TestNG
        </text>
        <circle cx='8' cy='9' r='1' fill='#10B981' />
        <circle cx='12' cy='9' r='1' fill='#F59E0B' />
        <circle cx='16' cy='9' r='1' fill='#EF4444' />
    </svg>
);

// New Relic Logo
export const NewRelicIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/new_relic.svg'
        alt='New Relic'
        size={size}
        className={className}
    />
);

// Datadog Logo
export const DatadogIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/datadog.svg'
        alt='Datadog'
        size={size}
        className={className}
    />
);

// Teams Logo
export const TeamsIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/teams.svg'
        alt='Microsoft Teams'
        size={size}
        className={className}
    />
);

// Discord Logo
export const DiscordIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/discord.svg'
        alt='Discord'
        size={size}
        className={className}
    />
);

// PagerDuty Logo
export const PagerDutyIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='pagerduty-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#06AC38' />
                <stop offset='100%' stopColor='#028A2F' />
            </linearGradient>
        </defs>
        {/* PagerDuty logo design */}
        <circle cx='12' cy='12' r='10' fill='url(#pagerduty-gradient)' />
        <circle cx='12' cy='12' r='8' fill='white' />

        {/* Bell icon for alerting */}
        <path
            d='M12 2a3 3 0 0 1 3 3v6l2 2H7l2-2V5a3 3 0 0 1 3-3z'
            fill='#06AC38'
        />
        <path
            d='M8.5 16a3.5 3.5 0 0 0 7 0'
            stroke='#06AC38'
            strokeWidth='1.5'
            strokeLinecap='round'
        />

        {/* Alert indicators */}
        <circle cx='16' cy='8' r='2' fill='#FF4444' />
        <circle cx='16' cy='8' r='1' fill='white' />
    </svg>
);

// SVN (Subversion) Logo
export const SVNIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='svn-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#FF6B35' />
                <stop offset='100%' stopColor='#D84315' />
            </linearGradient>
        </defs>
        {/* SVN repository design */}
        <rect
            x='3'
            y='4'
            width='18'
            height='16'
            rx='2'
            fill='url(#svn-gradient)'
        />
        <rect x='5' y='6' width='14' height='12' rx='1' fill='white' />

        {/* SVN branching visualization */}
        <circle cx='8' cy='9' r='1' fill='#FF6B35' />
        <circle cx='12' cy='12' r='1' fill='#FF6B35' />
        <circle cx='16' cy='15' r='1' fill='#FF6B35' />

        {/* Branch lines */}
        <path
            d='M8 10L12 11M12 13L16 14'
            stroke='#FF6B35'
            strokeWidth='1.5'
            strokeLinecap='round'
        />

        {/* SVN text */}
        <text
            x='12'
            y='8'
            textAnchor='middle'
            fontSize='6'
            fontWeight='bold'
            fill='#FF6B35'
        >
            SVN
        </text>
    </svg>
);

// Mercurial Logo
export const MercurialIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='mercurial-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#999999' />
                <stop offset='100%' stopColor='#666666' />
            </linearGradient>
        </defs>
        {/* Mercurial repository design */}
        <circle cx='12' cy='12' r='10' fill='url(#mercurial-gradient)' />
        <circle cx='12' cy='12' r='8' fill='white' />

        {/* Mercury symbol (Hg) */}
        <text
            x='12'
            y='16'
            textAnchor='middle'
            fontSize='8'
            fontWeight='bold'
            fill='#999999'
        >
            Hg
        </text>

        {/* Branch visualization */}
        <path
            d='M8 8L12 10L16 8M12 10L12 6'
            stroke='#999999'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <circle cx='8' cy='8' r='1' fill='#999999' />
        <circle cx='12' cy='6' r='1' fill='#999999' />
        <circle cx='16' cy='8' r='1' fill='#999999' />
    </svg>
);

// Perforce Logo
export const PerforceIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='perforce-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#404040' />
                <stop offset='100%' stopColor='#1A1A1A' />
            </linearGradient>
        </defs>
        {/* Perforce design */}
        <rect
            x='3'
            y='3'
            width='18'
            height='18'
            rx='3'
            fill='url(#perforce-gradient)'
        />
        <rect x='5' y='5' width='14' height='14' rx='2' fill='white' />

        {/* Perforce P4 logo */}
        <text
            x='12'
            y='16'
            textAnchor='middle'
            fontSize='7'
            fontWeight='bold'
            fill='#404040'
        >
            P4
        </text>

        {/* Depot visualization */}
        <rect x='8' y='7' width='8' height='1' fill='#404040' />
        <rect x='9' y='9' width='6' height='1' fill='#404040' />
        <rect x='10' y='11' width='4' height='1' fill='#404040' />
    </svg>
);

// Manual Approval Logo
export const ManualApprovalIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='approval-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#4CAF50' />
                <stop offset='100%' stopColor='#2E7D32' />
            </linearGradient>
        </defs>
        {/* Manual approval design */}
        <circle cx='12' cy='12' r='10' fill='url(#approval-gradient)' />
        <circle cx='12' cy='12' r='8' fill='white' />

        {/* Checkmark */}
        <path
            d='M8 12l2 2 4-4'
            stroke='#4CAF50'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />

        {/* User icon */}
        <circle cx='12' cy='7' r='1.5' fill='#4CAF50' />
        <path
            d='M9 17c0-1.7 1.3-3 3-3s3 1.3 3 3'
            stroke='#4CAF50'
            strokeWidth='1.5'
            strokeLinecap='round'
        />
    </svg>
);

// Development Environment Icon
export const DevEnvironmentIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='dev-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#10B981' />
                <stop offset='100%' stopColor='#059669' />
            </linearGradient>
        </defs>
        {/* Terminal/Code Editor Frame */}
        <rect
            x='2'
            y='3'
            width='20'
            height='18'
            rx='3'
            fill='url(#dev-gradient)'
        />
        <rect x='3' y='6' width='18' height='14' rx='2' fill='#1F2937' />

        {/* Terminal Header */}
        <circle cx='5' cy='4.5' r='0.8' fill='#EF4444' />
        <circle cx='7' cy='4.5' r='0.8' fill='#F59E0B' />
        <circle cx='9' cy='4.5' r='0.8' fill='#10B981' />

        {/* Code Lines */}
        <rect x='5' y='8' width='3' height='1' rx='0.5' fill='#10B981' />
        <rect x='9' y='8' width='6' height='1' rx='0.5' fill='#60A5FA' />
        <rect x='5' y='10' width='8' height='1' rx='0.5' fill='#A78BFA' />
        <rect x='5' y='12' width='5' height='1' rx='0.5' fill='#F472B6' />
        <rect x='5' y='14' width='10' height='1' rx='0.5' fill='#34D399' />
        <rect x='5' y='16' width='4' height='1' rx='0.5' fill='#FBBF24' />

        {/* Cursor */}
        <rect x='10' y='16' width='0.5' height='1' fill='#10B981' />

        {/* Dev Badge */}
        <circle cx='18' cy='6' r='2' fill='#10B981' />
        <path
            d='M17 6l0.5 0.5L19 5'
            stroke='white'
            strokeWidth='0.8'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// QA Environment Icon
export const QAEnvironmentIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='qa-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#F59E0B' />
                <stop offset='100%' stopColor='#D97706' />
            </linearGradient>
        </defs>
        {/* Testing Device Frame */}
        <rect
            x='2'
            y='3'
            width='20'
            height='18'
            rx='3'
            fill='url(#qa-gradient)'
        />
        <rect x='3' y='6' width='18' height='13' rx='2' fill='#FEF3C7' />

        {/* Test Dashboard Header */}
        <rect x='5' y='8' width='14' height='2' rx='1' fill='#F59E0B' />
        <circle cx='17' cy='9' r='0.5' fill='white' />
        <rect x='16.5' y='8.7' width='1' height='0.6' rx='0.3' fill='white' />

        {/* Test Results List */}
        <circle cx='6' cy='12' r='0.8' fill='#10B981' />
        <path
            d='M5.3 12l0.4 0.3 0.6-0.6'
            stroke='white'
            strokeWidth='0.6'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <rect x='8' y='11.5' width='8' height='1' rx='0.5' fill='#6B7280' />

        <circle cx='6' cy='14.5' r='0.8' fill='#EF4444' />
        <path
            d='M5.5 14l1 1M6.5 14l-1 1'
            stroke='white'
            strokeWidth='0.6'
            strokeLinecap='round'
        />
        <rect x='8' y='14' width='6' height='1' rx='0.5' fill='#6B7280' />

        <circle cx='6' cy='17' r='0.8' fill='#F59E0B' />
        <circle cx='6' cy='17' r='0.3' fill='white' />
        <rect x='8' y='16.5' width='7' height='1' rx='0.5' fill='#6B7280' />

        {/* QA Badge */}
        <circle cx='18' cy='6' r='2' fill='#F59E0B' />
        <rect x='17.2' y='5.2' width='1.6' height='1.6' rx='0.3' fill='white' />
        <path
            d='M17.5 6l0.3 0.3 0.5-0.6'
            stroke='#F59E0B'
            strokeWidth='0.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// Production Environment Icon
export const ProductionEnvironmentIcon = ({
    className = '',
    size = 24,
}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='prod-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#EF4444' />
                <stop offset='100%' stopColor='#DC2626' />
            </linearGradient>
        </defs>
        {/* Server Rack Frame */}
        <rect
            x='2'
            y='3'
            width='20'
            height='18'
            rx='3'
            fill='url(#prod-gradient)'
        />
        <rect x='3' y='5' width='18' height='15' rx='2' fill='#1F2937' />

        {/* Server Status Lights */}
        <circle cx='5' cy='7' r='0.8' fill='#10B981' />
        <circle cx='7' cy='7' r='0.8' fill='#10B981' />
        <circle cx='9' cy='7' r='0.8' fill='#F59E0B' />

        {/* Server Panels */}
        <rect
            x='5'
            y='9'
            width='14'
            height='2'
            rx='0.5'
            fill='#374151'
            stroke='#6B7280'
            strokeWidth='0.5'
        />
        <rect x='6' y='9.5' width='2' height='1' rx='0.3' fill='#10B981' />
        <rect x='9' y='9.5' width='8' height='0.5' rx='0.25' fill='#6B7280' />

        <rect
            x='5'
            y='12'
            width='14'
            height='2'
            rx='0.5'
            fill='#374151'
            stroke='#6B7280'
            strokeWidth='0.5'
        />
        <rect x='6' y='12.5' width='2' height='1' rx='0.3' fill='#10B981' />
        <rect x='9' y='12.5' width='6' height='0.5' rx='0.25' fill='#6B7280' />

        <rect
            x='5'
            y='15'
            width='14'
            height='2'
            rx='0.5'
            fill='#374151'
            stroke='#6B7280'
            strokeWidth='0.5'
        />
        <rect x='6' y='15.5' width='2' height='1' rx='0.3' fill='#EF4444' />
        <rect x='9' y='15.5' width='4' height='0.5' rx='0.25' fill='#6B7280' />

        {/* Network Activity */}
        <rect
            x='15'
            y='10'
            width='3'
            height='1'
            rx='0.5'
            fill='#10B981'
            opacity='0.8'
        />
        <rect
            x='15'
            y='13'
            width='2'
            height='1'
            rx='0.5'
            fill='#60A5FA'
            opacity='0.6'
        />
        <rect
            x='15'
            y='16'
            width='1'
            height='1'
            rx='0.5'
            fill='#F472B6'
            opacity='0.4'
        />

        {/* Production Badge */}
        <circle cx='18' cy='6' r='2' fill='#EF4444' />
        <path
            d='M17 6.5l1 1 2-2'
            stroke='white'
            strokeWidth='0.8'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// CircleCI Logo
export const CircleCIIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/circleci.svg'
        alt='CircleCI'
        size={size}
        className={className}
    />
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

// Terraform Logo
export const TerraformIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/terraform.svg'
        alt='Terraform'
        size={size}
        className={className}
    />
);

// Ansible Logo
export const AnsibleIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/ansible.svg'
        alt='Ansible'
        size={size}
        className={className}
    />
);

// Prometheus Logo
export const PrometheusIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/prometheus.svg'
        alt='Prometheus'
        size={size}
        className={className}
    />
);

// Grafana Logo
export const GrafanaIcon = ({className = '', size = 24}: IconProps) => (
    <ImgIcon
        src='/images/logos/grafana.svg'
        alt='Grafana'
        size={size}
        className={className}
    />
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

// Sticky Note Icon - Yellow sticky note design
export const StickyNoteIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='sticky-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#FEF08A' />
                <stop offset='100%' stopColor='#EAB308' />
            </linearGradient>
        </defs>
        {/* Sticky note background */}
        <path
            d='M4 4h14l2 2v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
            fill='url(#sticky-gradient)'
            stroke='#CA8A04'
            strokeWidth='1'
        />
        {/* Folded corner */}
        <path
            d='M18 4v2h2'
            fill='none'
            stroke='#CA8A04'
            strokeWidth='1'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        {/* Lines on the note */}
        <line
            x1='7'
            y1='9'
            x2='16'
            y2='9'
            stroke='#92400E'
            strokeWidth='0.8'
            strokeLinecap='round'
        />
        <line
            x1='7'
            y1='12'
            x2='14'
            y2='12'
            stroke='#92400E'
            strokeWidth='0.8'
            strokeLinecap='round'
        />
        <line
            x1='7'
            y1='15'
            x2='15'
            y2='15'
            stroke='#92400E'
            strokeWidth='0.8'
            strokeLinecap='round'
        />
    </svg>
);

// Comment Icon - Speech bubble design
export const CommentIcon = ({className = '', size = 24}: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
    >
        <defs>
            <linearGradient
                id='comment-gradient'
                x1='0%'
                y1='0%'
                x2='100%'
                y2='100%'
            >
                <stop offset='0%' stopColor='#DBEAFE' />
                <stop offset='100%' stopColor='#3B82F6' />
            </linearGradient>
        </defs>
        {/* Comment bubble */}
        <path
            d='M21 15c0 1.1-.9 2-2 2H7l-4 4V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v10z'
            fill='url(#comment-gradient)'
            stroke='#2563EB'
            strokeWidth='1'
        />
        {/* Comment dots */}
        <circle cx='8' cy='10' r='1.5' fill='white' />
        <circle cx='12' cy='10' r='1.5' fill='white' />
        <circle cx='16' cy='10' r='1.5' fill='white' />
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
        cloudfoundry: CloudFoundryIcon,
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
        // New icons
        travis: TravisCIIcon,
        teamcity: TeamCityIcon,
        mocha: MochaIcon,
        playwright: PlaywrightIcon,
        testng: TestNGIcon,
        newrelic: NewRelicIcon,
        datadog: DatadogIcon,
        teams: TeamsIcon,
        discord: DiscordIcon,
        pagerduty: PagerDutyIcon,
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
        // Environment icons
        devenvironment: DevEnvironmentIcon,
        qaenvironment: QAEnvironmentIcon,
        prodenvironment: ProductionEnvironmentIcon,
        svn: SVNIcon,
        mercurial: MercurialIcon,
        perforce: PerforceIcon,
        manualapproval: ManualApprovalIcon,
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
        // Annotation icons
        stickynote: StickyNoteIcon,
        comment: CommentIcon,
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
