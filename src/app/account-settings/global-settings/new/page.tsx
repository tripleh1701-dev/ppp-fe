'use client';

import {useEffect, useMemo, useState} from 'react';
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

// No mock/fallback accounts

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
    Slack: {name: 'slack'},
    Other: {name: 'maven'},
};

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
    Slack: '#4A154B',
    Other: '#64748B',
};

type CategorySelections = Record<string, string[]>;

const CATEGORY_COLORS: Record<string, string> = {
    plan: '#6366F1',
    code: '#22C55E',
    build: '#F59E0B',
    test: '#06B6D4',
    release: '#EC4899',
    deploy: '#8B5CF6',
    others: '#64748B',
};

export default function NewGlobalSettingsPage() {
    const router = useRouter();

    const [accounts, setAccounts] = useState<AccountMinimal[]>([]);
    const [enterprises, setEnterprises] = useState<EnterpriseMinimal[]>([]);
    const [accountId, setAccountId] = useState('');
    const [accountName, setAccountName] = useState('');
    const [enterpriseId, setEnterpriseId] = useState('');
    const [enterpriseName, setEnterpriseName] = useState('');
    const [entities, setEntities] = useState<string[]>([]);
    const [entityOptions, setEntityOptions] = useState<string[]>([]);
    const [entitiesLoading, setEntitiesLoading] = useState(false);

    // Base selections (used for "apply to many")
    const [baseSelections, setBaseSelections] = useState<CategorySelections>(
        {},
    );
    // Per-entity selections override
    const [selectionsByEntity, setSelectionsByEntity] = useState<
        Record<string, CategorySelections>
    >({});

    // Modal state
    const [configureEntity, setConfigureEntity] = useState<string | null>(null);
    const [copyOpen, setCopyOpen] = useState(false);
    const [copyFrom, setCopyFrom] = useState<string>('');
    const [copyTargets, setCopyTargets] = useState<Record<string, boolean>>({});

    useEffect(() => {
        (async () => {
            try {
                const [accountsApi, enterprisesApi] = await Promise.all([
                    api.get<AccountMinimal[]>('/api/accounts'),
                    api.get<EnterpriseMinimal[]>('/api/enterprises'),
                ]);
                if (Array.isArray(accountsApi)) {
                    setAccounts(
                        accountsApi.map((a) => ({
                            id: String(a.id),
                            accountName: a.accountName,
                        })),
                    );
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
                setAccounts([]);
                setEnterprises([]);
            }
        })();
    }, []);

    // Load entities when account + enterprise are selected
    useEffect(() => {
        const loadEntities = async () => {
            if (!enterpriseId && !enterpriseName) {
                setEntityOptions([]);
                setEntities([]);
                setSelectionsByEntity({});
                return;
            }
            setEntitiesLoading(true);
            try {
                // Prefer enterpriseId if available; else use enterpriseName
                const qs = new URLSearchParams(
                    enterpriseId
                        ? {enterpriseId}
                        : {enterpriseName: enterpriseName},
                ).toString();
                const list = await api.get<string[]>(
                    `/api/business-units/entities?${qs}`,
                );
                let opts = Array.isArray(list) ? list : [];

                // No client-side or demo fallback: trust backend entirely
                setEntityOptions(opts || []);
                // Reset selections when context changes
                setEntities(opts || []);
                setSelectionsByEntity({});
                setBaseSelections({});
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to load entities', e);
                setEntityOptions([]);
                setEntities([]);
                setSelectionsByEntity({});
                setBaseSelections({});
            } finally {
                setEntitiesLoading(false);
            }
        };
        loadEntities().catch(() => {});
    }, [accountId, enterpriseName]);

    // Derived
    const canSave = accountId && enterpriseName && entityOptions.length > 0;

    // Helpers
    const ensureEntitySelection = (entity: string) => {
        setSelectionsByEntity((prev) => ({
            ...prev,
            [entity]: prev[entity] || {},
        }));
    };

    const toggleEntity = (name: string) => {
        setEntities((prev) => {
            const exists = prev.includes(name);
            const next = exists
                ? prev.filter((e) => e !== name)
                : [...prev, name];
            // initialize/destroy per-entity selection
            setSelectionsByEntity((p) => {
                const clone = {...p};
                if (!exists) {
                    clone[name] = clone[name] || {};
                } else {
                    delete clone[name];
                }
                return clone;
            });
            return next;
        });
    };

    const toggleBaseSelection = (category: string, option: string) => {
        setBaseSelections((prev) => {
            const current = prev[category] || [];
            const next = current.includes(option)
                ? current.filter((o) => o !== option)
                : [...current, option];
            return {...prev, [category]: next};
        });
    };

    const toggleEntitySelection = (
        entity: string,
        category: string,
        option: string,
    ) => {
        setSelectionsByEntity((prev) => {
            const byEntity = {...prev};
            const current = byEntity[entity]?.[category] || [];
            const next = current.includes(option)
                ? current.filter((o) => o !== option)
                : [...current, option];
            byEntity[entity] = {
                ...(byEntity[entity] || {}),
                [category]: next,
            };
            return byEntity;
        });
    };

    const selectionsSummary = (sel: CategorySelections | undefined) => {
        const s = sel || {};
        const total = Object.values(s).reduce(
            (acc, arr) => acc + (arr?.length || 0),
            0,
        );
        return total;
    };

    const getEntitySelections = (entity: string): CategorySelections => {
        return selectionsByEntity[entity] || {};
    };

    const SelectionPill = ({entity}: {entity: string}) => {
        const s = getEntitySelections(entity);
        const total = selectionsSummary(s);
        const entries = Object.entries(CATEGORY_OPTIONS).map(([cat]) => ({
            cat,
            count: (s[cat] || []).length,
        }));
        const sum = entries.reduce((a, b) => a + b.count, 0) || 1;
        const [open, setOpen] = useState(false);
        const [coords, setCoords] = useState<{
            top: number;
            left: number;
        } | null>(null);
        const stateLabel = total === 0 ? 'Pending' : 'Configured';
        const stateClass =
            total === 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';
        return (
            <>
                <span
                    onMouseEnter={(e) => {
                        const r = (
                            e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        const left = Math.min(
                            Math.max(12, r.left),
                            window.innerWidth - 380,
                        );
                        const top = Math.min(
                            r.bottom + 8,
                            window.innerHeight - 220,
                        );
                        setCoords({top, left});
                        setOpen(true);
                    }}
                    onMouseLeave={() => setOpen(false)}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium border ${stateClass}`}
                >
                    <span>{stateLabel}</span>
                    <span className='inline-block h-1 w-1 rounded-full bg-slate-300'></span>
                    <span>{total} selected</span>
                </span>
                {open && coords && (
                    <div
                        style={{
                            position: 'fixed',
                            top: coords.top,
                            left: coords.left,
                            zIndex: 70,
                        }}
                        className='rounded-xl border border-slate-200 bg-white shadow-2xl p-4 w-auto min-w-[360px] max-w-[500px] whitespace-normal break-words'
                        onMouseEnter={() => setOpen(true)}
                        onMouseLeave={() => setOpen(false)}
                    >
                        <div className='mb-2 text-xs font-semibold text-secondary'>
                            Selections for {entity}
                        </div>
                        {total === 0 ? (
                            <div className='rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm leading-relaxed whitespace-normal break-words p-3'>
                                No settings configured yet for {entity}. Click
                                Configure to select tools per category.
                            </div>
                        ) : (
                            <>
                                <div className='mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100'>
                                    <div className='flex h-full w-full'>
                                        {entries.map(({cat, count}) => {
                                            const width = `${Math.max(
                                                0,
                                                Math.round((count / sum) * 100),
                                            )}%`;
                                            return (
                                                <div
                                                    key={cat}
                                                    title={`${cat}: ${count}`}
                                                    style={{
                                                        width,
                                                        backgroundColor:
                                                            CATEGORY_COLORS[
                                                                cat
                                                            ],
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    {Object.entries(CATEGORY_OPTIONS).map(
                                        ([cat]) => {
                                            const list = s[cat] || [];
                                            return (
                                                <div
                                                    key={cat}
                                                    className='rounded-lg border border-slate-200 p-2'
                                                >
                                                    <div className='mb-1 flex items-center justify-between'>
                                                        <div className='text-xs font-semibold capitalize text-primary'>
                                                            {cat}
                                                        </div>
                                                        <div className='text-[10px] text-secondary'>
                                                            {list.length}
                                                        </div>
                                                    </div>
                                                    {list.length === 0 ? (
                                                        <div className='text-[11px] text-secondary'>
                                                            None
                                                        </div>
                                                    ) : (
                                                        <div className='flex flex-wrap gap-1'>
                                                            {list.map(
                                                                (tool) => (
                                                                    <span
                                                                        key={
                                                                            tool
                                                                        }
                                                                        className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-primary'
                                                                    >
                                                                        <Icon
                                                                            name={
                                                                                OPTION_ICON[
                                                                                    tool
                                                                                ]
                                                                                    ?.name ||
                                                                                'git'
                                                                            }
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        {tool}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </>
        );
    };

    const applyCopy = () => {
        if (!copyFrom) return;
        setSelectionsByEntity((prev) => {
            const src = prev[copyFrom] || {};
            const next = {...prev};
            Object.entries(copyTargets)
                .filter(([, v]) => v)
                .forEach(([entity]) => {
                    if (entity === copyFrom) return;
                    next[entity] = JSON.parse(JSON.stringify(src));
                });
            return next;
        });
        setCopyOpen(false);
        setCopyTargets({});
    };

    const areSelectionsUniform = useMemo(() => {
        if (entities.length <= 1) return true;
        const first = selectionsByEntity[entities[0]] || {};
        const same = entities.every((e) => {
            const cur = selectionsByEntity[e] || {};
            return JSON.stringify(cur) === JSON.stringify(first);
        });
        return same;
    }, [entities, selectionsByEntity]);

    const save = async () => {
        if (!canSave) return;

        const accountName =
            accounts.find((a) => a.id === accountId)?.accountName || '';

        // If user did not configure per-entity, use baseSelections for all
        const effectiveByEntity: Record<string, CategorySelections> = {};
        (entityOptions || []).forEach((e) => {
            effectiveByEntity[e] =
                Object.keys(selectionsByEntity[e] || {}).length > 0
                    ? selectionsByEntity[e]
                    : baseSelections;
        });

        // If all entities share identical selections, save one record with all entities
        const listForSave = entityOptions || [];
        const firstSel = effectiveByEntity[listForSave[0]] || {};
        const uniform = listForSave.every(
            (e) =>
                JSON.stringify(effectiveByEntity[e] || {}) ===
                JSON.stringify(firstSel),
        );

        try {
            if (uniform) {
                await api.post('/api/global-settings', {
                    accountId,
                    accountName,
                    enterpriseName,
                    entities: listForSave,
                    categories: {
                        plan: firstSel.plan || [],
                        code: firstSel.code || [],
                        build: firstSel.build || [],
                        test: firstSel.test || [],
                        release: firstSel.release || [],
                        deploy: firstSel.deploy || [],
                        others: firstSel.others || [],
                    },
                });
            } else {
                // Create one record per entity so that overrides persist cleanly
                await Promise.all(
                    listForSave.map((entity) =>
                        api.post('/api/global-settings', {
                            accountId,
                            accountName,
                            enterpriseName,
                            entities: [entity],
                            categories: {
                                plan: effectiveByEntity[entity]?.plan || [],
                                code: effectiveByEntity[entity]?.code || [],
                                build: effectiveByEntity[entity]?.build || [],
                                test: effectiveByEntity[entity]?.test || [],
                                release:
                                    effectiveByEntity[entity]?.release || [],
                                deploy: effectiveByEntity[entity]?.deploy || [],
                                others: effectiveByEntity[entity]?.others || [],
                            },
                        }),
                    ),
                );
            }
        } catch {
            // no-op (toast could be added)
        }
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
                            Account
                        </label>
                        <select
                            value={accountId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setAccountId(val);
                                const name =
                                    accounts.find((a) => a.id === val)
                                        ?.accountName || '';
                                setAccountName(name);
                            }}
                            className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
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
                            Enterprise
                        </label>
                        <select
                            value={enterpriseName}
                            onChange={(e) => {
                                const val = e.target.value;
                                setEnterpriseName(val);
                                const ent = enterprises.find(
                                    (en) => en.name === val,
                                );
                                setEnterpriseId(ent?.id || '');
                            }}
                            className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
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

                {accountId && enterpriseName && (
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <div className='text-sm font-semibold text-primary'>
                                Entities
                            </div>
                            <div className='flex items-center gap-2'>
                                {entities.length > 1 && (
                                    <button
                                        onClick={() => setCopyOpen(true)}
                                        className='text-sm px-3 py-2 rounded-lg bg-white border border-light hover:bg-slate-50 text-primary shadow-sm'
                                    >
                                        Copy Settings
                                    </button>
                                )}
                            </div>
                        </div>
                        {entitiesLoading ? (
                            <div className='text-sm text-secondary'>
                                Loading entities…
                            </div>
                        ) : entityOptions.length === 0 ? (
                            <div className='text-sm text-secondary'>
                                <div>
                                    No entities found for this selection. You
                                    can add them in{' '}
                                    <a
                                        href='/account-settings/business-unit-settings'
                                        className='text-brand underline hover:text-brand-dark'
                                    >
                                        Business Unit Settings
                                    </a>
                                    .
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {entityOptions.length > 0 && (
                    <div className='space-y-4'>
                        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
                            <table className='min-w-full divide-y divide-slate-100'>
                                <thead className='bg-tertiary/40'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Account
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Enterprise
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Entity
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Configuration
                                        </th>
                                        <th className='px-6 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {(entityOptions || []).map((entity) => {
                                        const sum = selectionsSummary(
                                            selectionsByEntity[entity],
                                        );
                                        return (
                                            <tr
                                                key={entity}
                                                className='transition-all duration-200 hover:bg-indigo-50/40'
                                            >
                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                                    <span className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-primary'>
                                                        <svg
                                                            className='w-3.5 h-3.5 text-slate-500'
                                                            viewBox='0 0 24 24'
                                                            fill='currentColor'
                                                        >
                                                            <path d='M10 3a1 1 0 011 1v1h2V4a1 1 0 112 0v1h1a3 3 0 013 3v1H4V8a3 3 0 013-3h1V4a1 1 0 011-1z'></path>
                                                            <path d='M4 10h16v7a3 3 0 01-3 3H7a3 3 0 01-3-3v-7z'></path>
                                                        </svg>
                                                        {
                                                            accounts.find(
                                                                (a) =>
                                                                    a.id ===
                                                                    accountId,
                                                            )?.accountName
                                                        }
                                                    </span>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                                    <span className='inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700'>
                                                        <svg
                                                            className='w-3.5 h-3.5 text-indigo-600'
                                                            viewBox='0 0 24 24'
                                                            fill='currentColor'
                                                        >
                                                            <path d='M3 21V8l9-5 9 5v13h-6v-6H9v6H3z'></path>
                                                        </svg>
                                                        {enterpriseName}
                                                    </span>
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                                    {entity}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                                    <SelectionPill
                                                        entity={entity}
                                                    />
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-right text-sm'>
                                                    <button
                                                        onClick={() => {
                                                            ensureEntitySelection(
                                                                entity,
                                                            );
                                                            setConfigureEntity(
                                                                entity,
                                                            );
                                                        }}
                                                        className='inline-flex items-center px-3 py-2 rounded-lg bg-primary text-inverse hover:bg-primary-dark shadow-sm'
                                                    >
                                                        Configure
                                                    </button>
                                                    {entityOptions.length >
                                                        1 && (
                                                        <button
                                                            onClick={() => {
                                                                setCopyFrom(
                                                                    entity,
                                                                );
                                                                const targets: Record<
                                                                    string,
                                                                    boolean
                                                                > = {};
                                                                (
                                                                    entityOptions ||
                                                                    []
                                                                )
                                                                    .filter(
                                                                        (e) =>
                                                                            e !==
                                                                            entity,
                                                                    )
                                                                    .forEach(
                                                                        (e) =>
                                                                            (targets[
                                                                                e
                                                                            ] =
                                                                                true),
                                                                    );
                                                                setCopyTargets(
                                                                    targets,
                                                                );
                                                                setCopyOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            className='ml-2 inline-flex items-center px-3 py-2 rounded-lg bg-white border border-light hover:bg-slate-50 text-primary shadow-sm'
                                                        >
                                                            Copy to others
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {entityOptions.length > 1 && (
                            <div className='rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50 p-4 text-sm text-primary'>
                                Tip: Configure one entity and use &quot;Copy
                                settings&quot; to replicate.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Configure Modal */}
            {configureEntity && (
                <div className='fixed inset-0 z-50 flex items-end md:items-center justify-center p-4'>
                    <div className='absolute inset-0 bg-black/50 animate-[fadeIn_200ms_ease-out]'></div>
                    <div className='relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-light overflow-hidden animate-[slideUp_240ms_ease-out]'>
                        <div className='px-6 py-4 border-b border-light flex items-center justify-between'>
                            <div>
                                <div className='text-sm text-secondary'>
                                    Configure entity
                                </div>
                                <h3 className='text-lg font-bold text-primary'>
                                    {configureEntity}
                                </h3>
                            </div>
                            <button
                                onClick={() => setConfigureEntity(null)}
                                className='h-10 w-10 inline-flex items-center justify-center rounded-full border border-light text-secondary hover:bg-slate-100'
                                aria-label='Close'
                            >
                                <svg
                                    className='w-5 h-5'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth='2'
                                        d='M6 18L18 6M6 6l12 12'
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className='p-6 space-y-6 max-h-[70vh] overflow-y-auto'>
                            <div className='rounded-2xl border border-slate-200 overflow-hidden bg-white'>
                                <table className='min-w-full divide-y divide-slate-100'>
                                    <thead className='bg-tertiary/40'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                                Category
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                                Tools
                                            </th>
                                            <th className='px-6 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider'>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-slate-100'>
                                        {Object.entries(CATEGORY_OPTIONS).map(
                                            ([category, options]) => {
                                                const selected =
                                                    selectionsByEntity[
                                                        configureEntity || ''
                                                    ]?.[category] || [];
                                                const isSelected = (
                                                    opt: string,
                                                ) => selected.includes(opt);
                                                return (
                                                    <tr
                                                        key={category}
                                                        className='align-top'
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold capitalize text-primary'>
                                                            {category}
                                                        </td>
                                                        <td className='px-6 py-4'>
                                                            <div className='flex flex-wrap gap-2'>
                                                                {options.map(
                                                                    (opt) => {
                                                                        const active =
                                                                            isSelected(
                                                                                opt,
                                                                            );
                                                                        return (
                                                                            <button
                                                                                key={
                                                                                    opt
                                                                                }
                                                                                type='button'
                                                                                onClick={() =>
                                                                                    toggleEntitySelection(
                                                                                        configureEntity as string,
                                                                                        category,
                                                                                        opt,
                                                                                    )
                                                                                }
                                                                                className={`relative inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-transform duration-200 ${
                                                                                    active
                                                                                        ? 'bg-white text-primary border-indigo-500 shadow-md scale-[1.01] ring-2 ring-indigo-200/60'
                                                                                        : 'bg-white text-primary border-slate-200 hover:border-slate-300 hover:shadow hover:scale-[1.01]'
                                                                                }`}
                                                                            >
                                                                                <div className='h-5 w-5 flex items-center justify-center'>
                                                                                    <Icon
                                                                                        name={
                                                                                            OPTION_ICON[
                                                                                                opt
                                                                                            ]
                                                                                                ?.name ||
                                                                                            'git'
                                                                                        }
                                                                                        size={
                                                                                            16
                                                                                        }
                                                                                        className={
                                                                                            'text-primary'
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <span>
                                                                                    {
                                                                                        opt
                                                                                    }
                                                                                </span>
                                                                                {active && (
                                                                                    <span className='pointer-events-none absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white flex items-center justify-center text-[9px] shadow-md ring-2 ring-white'>
                                                                                        ✓
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-right'>
                                                            <div className='inline-flex gap-2'>
                                                                <button
                                                                    className='px-3 py-1.5 text-xs rounded-lg border border-light bg-white hover:bg-slate-50'
                                                                    onClick={() => {
                                                                        // Select all in category
                                                                        options.forEach(
                                                                            (
                                                                                opt,
                                                                            ) => {
                                                                                if (
                                                                                    !isSelected(
                                                                                        opt,
                                                                                    )
                                                                                ) {
                                                                                    toggleEntitySelection(
                                                                                        configureEntity as string,
                                                                                        category,
                                                                                        opt,
                                                                                    );
                                                                                }
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    Select All
                                                                </button>
                                                                <button
                                                                    className='px-3 py-1.5 text-xs rounded-lg border border-light bg-white hover:bg-slate-50'
                                                                    onClick={() => {
                                                                        // Clear all in category
                                                                        options.forEach(
                                                                            (
                                                                                opt,
                                                                            ) => {
                                                                                if (
                                                                                    isSelected(
                                                                                        opt,
                                                                                    )
                                                                                ) {
                                                                                    toggleEntitySelection(
                                                                                        configureEntity as string,
                                                                                        category,
                                                                                        opt,
                                                                                    );
                                                                                }
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className='px-6 py-4 border-t border-light flex items-center justify-end gap-3 bg-white'>
                            <button
                                onClick={() => setConfigureEntity(null)}
                                className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Copy Modal */}
            {copyOpen && (
                <div className='fixed inset-0 z-50 flex items-end md:items-center justify-center p-4'>
                    <div className='absolute inset-0 bg-black/50'></div>
                    <div className='relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-light overflow-hidden'>
                        <div className='px-6 py-4 border-b border-light'>
                            <h3 className='text-lg font-bold text-primary'>
                                Copy settings across entities
                            </h3>
                            <p className='text-sm text-secondary mt-1'>
                                Select a source entity and the target entities
                                to receive the same settings.
                            </p>
                        </div>
                        <div className='p-6 space-y-6'>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Source entity
                                </label>
                                <select
                                    value={copyFrom}
                                    onChange={(e) =>
                                        setCopyFrom(e.target.value)
                                    }
                                    className='block w-full px-3 py-2.5 border border-light rounded-lg bg-card text-primary'
                                >
                                    <option value=''>Select source</option>
                                    {entities.map((e) => (
                                        <option key={e} value={e}>
                                            {e}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Target entities
                                </label>
                                <div className='flex flex-wrap gap-3'>
                                    {entities
                                        .filter((e) => e !== copyFrom)
                                        .map((e) => (
                                            <label
                                                key={e}
                                                className='inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-tertiary border-light text-primary'
                                            >
                                                <input
                                                    type='checkbox'
                                                    checked={!!copyTargets[e]}
                                                    onChange={(ev) =>
                                                        setCopyTargets((p) => ({
                                                            ...p,
                                                            [e]: ev.target
                                                                .checked,
                                                        }))
                                                    }
                                                />
                                                <span className='text-sm'>
                                                    {e}
                                                </span>
                                            </label>
                                        ))}
                                </div>
                            </div>
                        </div>
                        <div className='px-6 py-4 border-t border-light flex items-center justify-end gap-3 bg-white'>
                            <button
                                onClick={() => setCopyOpen(false)}
                                className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyCopy}
                                disabled={
                                    !copyFrom ||
                                    !Object.values(copyTargets).some(Boolean)
                                }
                                className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg'
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}