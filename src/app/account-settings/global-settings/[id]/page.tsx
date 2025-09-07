'use client';

import {useEffect, useMemo, useState} from 'react';
import {useParams, useSearchParams, useRouter} from 'next/navigation';
import {api} from '@/utils/api';
import {Icon} from '@/components/Icons';

interface GlobalSetting {
    id: string;
    accountId: string;
    accountName: string;
    enterpriseId?: string;
    enterpriseName: string;
    entities: string[];
    categories: Record<string, string[]>;
}

interface AccountMinimal {
    id: string;
    accountName: string;
}
interface EnterpriseMinimal {
    id: string;
    name: string;
}

export default function GlobalSettingsDetailPage() {
    const router = useRouter();
    const params = useParams<{id: string}>();
    const search = useSearchParams();
    const editMode = search?.get('edit') === '1';
    const [isEditing, setIsEditing] = useState(editMode);

    const [record, setRecord] = useState<GlobalSetting | null>(null);
    const [accounts, setAccounts] = useState<AccountMinimal[]>([]);
    const [enterprises, setEnterprises] = useState<EnterpriseMinimal[]>([]);

    // Editable state
    const [form, setForm] = useState<{
        accountId: string;
        accountName: string;
        enterpriseId?: string;
        enterpriseName: string;
        entities: string[];
        selections: Record<string, string[]>;
    }>({
        accountId: '',
        accountName: '',
        enterpriseId: '',
        enterpriseName: '',
        entities: [],
        selections: {},
    });

    useEffect(() => {
        (async () => {
            const id = params?.id;
            if (!id) return;
            const [rec, accs, ents] = await Promise.all([
                api.get<GlobalSetting>(`/api/global-settings/${id}`),
                api.get<AccountMinimal[]>(`/api/accounts`),
                api.get<EnterpriseMinimal[]>(`/api/enterprises`),
            ]);
            setRecord(rec);
            setAccounts(accs || []);
            setEnterprises(ents || []);
            setForm({
                accountId: rec.accountId,
                accountName: rec.accountName,
                enterpriseId: rec.enterpriseId || '',
                enterpriseName: rec.enterpriseName,
                entities: rec.entities || [],
                selections: rec.categories || {},
            });
        })().catch(() => {});
    }, [params?.id]);

    const disabled = !isEditing;
    const canSave = useMemo(() => {
        return (
            !!form.accountId &&
            !!form.enterpriseName &&
            (form.entities?.length || 0) > 0
        );
    }, [form]);

    const updateSelection = (category: string, option: string) => {
        setForm((prev) => {
            const current = prev.selections[category] || [];
            const next = current.includes(option)
                ? current.filter((x) => x !== option)
                : [...current, option];
            return {
                ...prev,
                selections: {...prev.selections, [category]: next},
            };
        });
    };

    const save = async () => {
        if (!record) return;
        if (!canSave) return;
        await api.put(`/api/global-settings/${record.id}`, {
            accountId: form.accountId,
            accountName:
                accounts.find((a) => a.id === form.accountId)?.accountName ||
                form.accountName,
            enterpriseId: form.enterpriseId,
            enterpriseName: form.enterpriseName,
            entities: form.entities,
            categories: form.selections,
        });
        router.push('/account-settings/global-settings');
    };

    // Full options (same as create screen)
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
        'Azure DevOps': {name: 'azdo'},
        Trello: {name: 'trello'},
        Asana: {name: 'asana'},
        GitHub: {name: 'github'},
        'GitHub Actions': {name: 'github'},
        GitLab: {name: 'gitlab'},
        'Azure Repos': {name: 'azure'},
        Bitbucket: {name: 'bitbucket'},
        SonarQube: {name: 'sonarqube'},
        Jenkins: {name: 'jenkins'},
        CircleCI: {name: 'circleci'},
        'AWS CodeBuild': {name: 'aws'},
        'Google Cloud Build': {name: 'cloudbuild'},
        Cypress: {name: 'cypress'},
        Selenium: {name: 'selenium'},
        Jest: {name: 'jest'},
        'Tricentis Tosca': {name: 'jest'},
        'Argo CD': {name: 'argo'},
        ServiceNow: {name: 'slack'},
        Kubernetes: {name: 'kubernetes'},
        Helm: {name: 'helm'},
        Terraform: {name: 'terraform'},
        Ansible: {name: 'ansible'},
        Docker: {name: 'docker'},
        'AWS CodePipeline': {name: 'codepipeline'},
        Prometheus: {name: 'prometheus'},
        Grafana: {name: 'grafana'},
        Slack: {name: 'slack'},
        Other: {name: 'maven'},
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <h1 className='text-xl font-bold text-primary'>
                        Global Settings {disabled ? 'View' : 'Edit'}
                    </h1>
                    <div className='flex items-center gap-3'>
                        {disabled ? (
                            <button
                                onClick={() =>
                                    router.push(
                                        '/account-settings/global-settings',
                                    )
                                }
                                className='px-4 py-2 text-sm font-medium text-primary bg-white border border-light rounded-lg hover:bg-slate-50'
                            >
                                Back to Global Settings
                            </button>
                        ) : (
                            <button
                                onClick={save}
                                disabled={!canSave}
                                className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg'
                            >
                                Update
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {!record ? (
                <div className='p-8 text-secondary'>Loading…</div>
            ) : (
                <div
                    className={`p-6 space-y-6 ${
                        disabled ? 'opacity-60 pointer-events-none' : ''
                    }`}
                >
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                Account
                            </label>
                            <select
                                disabled={disabled}
                                value={form.accountId}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        accountId: e.target.value,
                                        accountName:
                                            accounts.find(
                                                (a) => a.id === e.target.value,
                                            )?.accountName || '',
                                    }))
                                }
                                className='block w-full px-3 py-2.5 border border-light rounded-lg bg-card text-primary'
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
                                disabled={disabled}
                                value={form.enterpriseName}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        enterpriseName: e.target.value,
                                        enterpriseId: enterprises.find(
                                            (x) => x.name === e.target.value,
                                        )?.id,
                                    }))
                                }
                                className='block w-full px-3 py-2.5 border border-light rounded-lg bg-card text-primary'
                            >
                                <option value=''>Select an enterprise</option>
                                {enterprises.map((e) => (
                                    <option key={e.id} value={e.name}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Entities
                        </label>
                        <div className='flex gap-3 flex-wrap'>
                            {(record.entities || []).map((opt) => {
                                const checked = form.entities.includes(opt);
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
                                            disabled={disabled}
                                            checked={checked}
                                            onChange={() =>
                                                setForm((p) => ({
                                                    ...p,
                                                    entities: checked
                                                        ? p.entities.filter(
                                                              (e) => e !== opt,
                                                          )
                                                        : [...p.entities, opt],
                                                }))
                                            }
                                        />
                                        <span className='text-sm'>{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {Object.entries(CATEGORY_OPTIONS).map(
                            ([category, options]) => (
                                <div
                                    key={category}
                                    className='relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5 shadow-md'
                                >
                                    <div className='mb-4 flex items-center justify-between'>
                                        <div className='text-base font-semibold capitalize text-primary'>
                                            {category}
                                        </div>
                                        <div className='text-xs text-secondary'>
                                            {
                                                (
                                                    form.selections[category] ||
                                                    []
                                                ).length
                                            }{' '}
                                            selected
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                                        {options.map((opt) => {
                                            const isActive = (
                                                form.selections[category] || []
                                            ).includes(opt);
                                            return (
                                                <button
                                                    key={opt}
                                                    type='button'
                                                    disabled={disabled}
                                                    onClick={() =>
                                                        updateSelection(
                                                            category,
                                                            opt,
                                                        )
                                                    }
                                                    className={`group flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition-all duration-200 ${
                                                        isActive
                                                            ? 'bg-primary text-inverse border-primary shadow'
                                                            : 'bg-white/90 text-primary border-slate-200 hover:bg-white hover:shadow'
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                                                            isActive
                                                                ? 'bg-white/15'
                                                                : 'bg-slate-50'
                                                        }`}
                                                    >
                                                        <Icon
                                                            name={
                                                                OPTION_ICON[opt]
                                                                    ?.name ||
                                                                'git'
                                                            }
                                                            size={32}
                                                            className={
                                                                isActive
                                                                    ? 'text-inverse'
                                                                    : 'text-primary'
                                                            }
                                                        />
                                                    </div>
                                                    <div className='text-sm font-medium'>
                                                        {opt}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
