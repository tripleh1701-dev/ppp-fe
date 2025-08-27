'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Icon} from '@/components/Icons';
import {api} from '@/utils/api';

interface AccountMinimal {
    id: string;
    accountName: string;
}
interface EnterpriseMinimal {
    id: string;
    name: string;
}
interface GlobalSettingInput {
    accountId: string;
    accountName: string;
    enterpriseName: string;
    entities: string[];
    selections: Record<string, string[]>; // category -> choices
}

const STORAGE_KEY = 'global-settings';

const DEFAULT_ACCOUNTS: AccountMinimal[] = [
    {id: 'acc-1001', accountName: 'Acme Corp'},
    {id: 'acc-1002', accountName: 'Globex Ltd'},
    {id: 'acc-1003', accountName: 'Initech'},
];

// Enterprises will be loaded from backend

const ENTITY_OPTIONS = ['Finance', 'Payroll', 'People'];

const CATEGORY_OPTIONS: Record<string, string[]> = {
    plan: ['Jira', 'Azure DevOps', 'Trello', 'Asana', 'Other'],
    code: [
        'GitHub',
        'GitLab',
        'Azure Repos',
        'Bitbucket',
        'SonarQube',
        'Other',
    ],
    build: [
        'Jenkins',
        'GitHub Actions',
        'CircleCI',
        'AWS CodeBuild',
        'Google Cloud Build',
        'Azure DevOps',
        'Other',
    ],
    test: ['Cypress', 'Selenium', 'Jest', 'Tricentis Tosca', 'Other'],
    release: ['Argo CD', 'ServiceNow', 'Azure DevOps', 'Other'],
    deploy: [
        'Kubernetes',
        'Helm',
        'Terraform',
        'Ansible',
        'Docker',
        'AWS CodePipeline',
        'Other',
    ],
    others: ['Prometheus', 'Grafana', 'Slack', 'Other'],
};

const OPTION_ICON: Record<string, {name: string}> = {
    Jira: {name: 'jira'},
    GitHub: {name: 'github'},
    'GitHub Actions': {name: 'github'},
    GitLab: {name: 'gitlab'},
    'Azure Repos': {name: 'azure'},
    'Azure DevOps': {name: 'azdo'},
    Bitbucket: {name: 'bitbucket'},
    'AWS CodeBuild': {name: 'aws'},
    'Google Cloud Build': {name: 'cloudbuild'},
    'AWS CodePipeline': {name: 'codepipeline'},
    CircleCI: {name: 'circleci'},
    JFrog: {name: 'docker'},
    'Tricentis Tosca': {name: 'jest'},
    Cypress: {name: 'cypress'},
    Selenium: {name: 'selenium'},
    Jest: {name: 'jest'},
    'Argo CD': {name: 'argo'},
    ServiceNow: {name: 'slack'},
    Kubernetes: {name: 'kubernetes'},
    Helm: {name: 'helm'},
    Terraform: {name: 'terraform'},
    Ansible: {name: 'ansible'},
    Docker: {name: 'docker'},
    Prometheus: {name: 'prometheus'},
    Grafana: {name: 'grafana'},
    SonarQube: {name: 'sonarqube'},
    Integrations: {name: 'docker'},
    Extensions: {name: 'npm'},
    'SAC Deployments': {name: 'maven'},
    PQR: {name: 'git'},
    Other: {name: 'maven'},
};

// Brand color accents per tool (used for ring/glow)
const BRAND_COLOR: Record<string, string> = {
    Jira: '#2684FF',
    GitHub: '#24292E',
    'GitHub Actions': '#24292E',
    GitLab: '#E24329',
    'Azure Repos': '#0078D4',
    'Azure DevOps': '#0078D4',
    Bitbucket: '#2684FF',
    'AWS CodeBuild': '#FF9900',
    'Google Cloud Build': '#4285F4',
    'AWS CodePipeline': '#FF9900',
    CircleCI: '#161616',
    JFrog: '#41BF47',
    'Tricentis Tosca': '#C21325',
    Cypress: '#17202C',
    Selenium: '#43B02A',
    Jest: '#C21325',
    'Argo CD': '#F26B35',
    ServiceNow: '#10745E',
    Kubernetes: '#326CE5',
    Helm: '#0F1689',
    Terraform: '#7B42BC',
    Ansible: '#000000',
    Docker: '#2496ED',
    Prometheus: '#E6522C',
    Grafana: '#F46800',
    SonarQube: '#4C9BD6',
    Integrations: '#2496ED',
    Extensions: '#CB3837',
    'SAC Deployments': '#FF6B35',
    PQR: '#F1502F',
    Other: '#64748B',
};

export default function NewGlobalSettingsPage() {
    const router = useRouter();

    const [accounts, setAccounts] = useState<AccountMinimal[]>([]);
    const [enterprises, setEnterprises] = useState<EnterpriseMinimal[]>([]);
    const [data, setData] = useState<GlobalSettingInput>({
        accountId: '',
        accountName: '',
        enterpriseName: '',
        entities: [],
        selections: {},
    });

    useEffect(() => {
        (async () => {
            try {
                const [accountsApi, enterprisesApi] = await Promise.all([
                    api.get<AccountMinimal[]>('/api/accounts'),
                    api.get<EnterpriseMinimal[]>('/api/enterprises'),
                ]);
                if (Array.isArray(accountsApi) && accountsApi.length > 0) {
                    setAccounts(
                        accountsApi.map((a) => ({
                            id: String(a.id),
                            accountName: a.accountName,
                        })),
                    );
                } else {
                    setAccounts(DEFAULT_ACCOUNTS);
                }
                if (Array.isArray(enterprisesApi)) {
                    setEnterprises(
                        enterprisesApi.map((e) => ({
                            id: String(e.id),
                            name: e.name,
                        })),
                    );
                }
            } catch {
                setAccounts(DEFAULT_ACCOUNTS);
                setEnterprises([]);
            }
        })();
    }, []);

    // Entities state
    const [entityOptions, setEntityOptions] = useState<string[]>([]);
    const [entitiesLoading, setEntitiesLoading] = useState(false);

    // Load entities when account + enterprise are selected
    useEffect(() => {
        const loadEntities = async () => {
            if (!data.accountId || !data.enterpriseName) {
                setEntityOptions([]);
                return;
            }
            setEntitiesLoading(true);
            // Reset user selections when context changes
            setData((prev) => ({...prev, entities: []}));
            try {
                const qs = new URLSearchParams({
                    accountId: data.accountId,
                    enterpriseName: data.enterpriseName,
                }).toString();
                const entities = await api.get<string[]>(
                    `/api/business-units/entities?${qs}`,
                );
                setEntityOptions(Array.isArray(entities) ? entities : []);
            } catch {
                setEntityOptions([]);
            } finally {
                setEntitiesLoading(false);
            }
        };
        loadEntities().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.accountId, data.enterpriseName]);

    const canSave =
        data.accountId && data.enterpriseName && data.entities.length > 0;

    const toggleEntity = (name: string) => {
        setData((prev) => {
            const exists = prev.entities.includes(name);
            const nextEntities = exists
                ? prev.entities.filter((e) => e !== name)
                : [...prev.entities, name];
            return {...prev, entities: nextEntities};
        });
    };

    const toggleSelection = (category: string, option: string) => {
        setData((prev) => {
            const current = prev.selections[category] || [];
            const exists = current.includes(option);
            const next = exists
                ? current.filter((o) => o !== option)
                : [...current, option];
            return {
                ...prev,
                selections: {...prev.selections, [category]: next},
            };
        });
    };

    const save = async () => {
        if (!canSave) return;
        const record = {
            id: Date.now().toString(),
            accountId: data.accountId,
            accountName:
                accounts.find((a) => a.id === data.accountId)?.accountName ||
                '',
            enterpriseName: data.enterpriseName,
            entities: data.entities,
            categories: {
                plan: data.selections.plan || [],
                code: data.selections.code || [],
                build: data.selections.build || [],
                test: data.selections.test || [],
                release: data.selections.release || [],
                deploy: data.selections.deploy || [],
                others: data.selections.others || [],
            },
        };
        try {
            await api.post('/api/global-settings', record);
        } catch {}
        router.push('/account-settings/global-settings');
    };

    const CategoryCard = ({
        title,
        options,
        selected,
        onToggle,
    }: {
        title: string;
        options: string[];
        selected: string[];
        onToggle: (opt: string) => void;
    }) => {
        return (
            <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-2 hover:ring-indigo-300/50'>
                <div className='pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br from-fuchsia-200/40 to-sky-200/50 blur-2xl'></div>
                <div className='mb-4 flex items-center justify-between'>
                    <div className='text-base font-semibold capitalize text-primary'>
                        {title}
                    </div>
                    <div className='text-xs text-secondary'>
                        {selected.length} selected
                    </div>
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                    {options.map((opt) => {
                        const isActive = selected.includes(opt);
                        const brand = BRAND_COLOR[opt] || '#6366F1';
                        return (
                            <button
                                key={opt}
                                type='button'
                                onClick={() => onToggle(opt)}
                                className={`group flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition-all duration-200 ${
                                    isActive
                                        ? 'bg-primary text-inverse border-primary shadow-xl'
                                        : 'bg-white/90 text-primary border-slate-200 hover:bg-white hover:shadow-xl'
                                }`}
                                style={
                                    isActive
                                        ? {
                                              boxShadow: `0 10px 30px -10px ${brand}90`,
                                          }
                                        : {
                                              boxShadow: `0 8px 24px -12px ${brand}40`,
                                          }
                                }
                            >
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                                        isActive
                                            ? 'bg-white/15 scale-105'
                                            : 'bg-slate-50 group-hover:scale-110'
                                    }`}
                                    style={{border: `1px solid ${brand}20`}}
                                >
                                    <Icon
                                        name={OPTION_ICON[opt]?.name || 'git'}
                                        size={36}
                                        className={
                                            isActive
                                                ? 'text-inverse'
                                                : 'text-primary'
                                        }
                                    />
                                </div>
                                <div className='flex-1 truncate text-sm font-semibold'>
                                    {opt}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <h1 className='text-xl font-bold text-primary'>
                        Create Global Settings
                    </h1>
                    <div className='flex items-center gap-3'>
                        <button
                            onClick={() => router.back()}
                            className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg transition-colors duration-200'
                        >
                            Discard
                        </button>
                        <button
                            onClick={save}
                            disabled={!canSave}
                            className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg transition-colors duration-200'
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>

            <div className='p-6 space-y-8'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Select Account
                        </label>
                        <select
                            value={data.accountId}
                            onChange={(e) =>
                                setData((p) => ({
                                    ...p,
                                    accountId: e.target.value,
                                }))
                            }
                            className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary relative z-10'
                        >
                            <option value=''>Select an account</option>
                            {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.accountName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Select Enterprise
                        </label>
                        <select
                            value={data.enterpriseName}
                            onChange={(e) =>
                                setData((p) => ({
                                    ...p,
                                    enterpriseName: e.target.value,
                                }))
                            }
                            className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary relative z-20'
                        >
                            <option value=''>Select an enterprise</option>
                            {enterprises.map((ent) => (
                                <option key={ent.id} value={ent.name}>
                                    {ent.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {data.accountId && data.enterpriseName && (
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Select Entities
                        </label>
                        {entitiesLoading ? (
                            <div className='text-sm text-secondary'>
                                Loading entities…
                            </div>
                        ) : entityOptions.length === 0 ? (
                            <div className='text-sm text-secondary'>
                                No entities found for this selection. You can
                                add them in{' '}
                                <a
                                    href='/account-settings/business-unit-settings'
                                    className='text-brand underline hover:text-brand-dark'
                                >
                                    Business Unit Settings
                                </a>
                                .
                            </div>
                        ) : (
                            <div className='flex gap-3 flex-wrap'>
                                {entityOptions.map((opt) => {
                                    const checked = data.entities.includes(opt);
                                    return (
                                        <label
                                            key={opt}
                                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                                                checked
                                                    ? 'bg-primary-light/40 border-primary text-primary'
                                                    : 'bg-tertiary border-light text-primary'
                                            }`}
                                        >
                                            <input
                                                type='checkbox'
                                                checked={checked}
                                                onChange={() =>
                                                    toggleEntity(opt)
                                                }
                                            />
                                            <span className='text-sm'>
                                                {opt}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {data.entities.length > 0 && (
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {Object.entries(CATEGORY_OPTIONS).map(
                            ([category, options]) => (
                                <CategoryCard
                                    key={category}
                                    title={category}
                                    options={options}
                                    selected={data.selections[category] || []}
                                    onToggle={(opt) =>
                                        toggleSelection(category, opt)
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
