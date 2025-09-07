'use client';

import {useEffect, useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import {MagnifyingGlassIcon, PlusIcon} from '@heroicons/react/24/outline';
import {api} from '@/utils/api';

interface GroupRecord {
    id: string;
    name: string;
    description?: string;
}

export default function UserGroupsPage() {
    const params = useParams<{username: string}>();
    const username = decodeURIComponent(
        (params?.username as string | undefined) || '',
    );
    const [groups, setGroups] = useState<GroupRecord[]>([]);
    const [search, setSearch] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    const loadGroups = async () => {
        if (!username) return;
        const data = await api.get<GroupRecord[]>(
            `/api/user-groups/${encodeURIComponent(username)}`,
        );
        setGroups(data);
    };

    useEffect(() => {
        loadGroups().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return groups;
        return groups.filter((g) =>
            [g.name, g.description || ''].join(' ').toLowerCase().includes(q),
        );
    }, [groups, search]);

    const [enterprise, setEnterprise] = useState('');

    const createGroup = async () => {
        if (!name.trim()) return;
        await api.post(`/api/user-groups/${encodeURIComponent(username)}`, {
            name: name.trim(),
            description: desc.trim() || undefined,
            enterprise,
        });
        setName('');
        setDesc('');
        setEnterprise('');
        setShowCreateModal(false);
        await loadGroups();
    };

    const enterpriseOptions: string[] = [];

    return (
        <div className='h-full bg-secondary flex flex-col'>
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-xl font-bold text-primary'>
                            Assigned user groups:{' '}
                            {groups.length.toString().padStart(2, '0')}
                        </h1>
                        <p className='text-sm text-secondary mt-1'>
                            Manage users: {username} / Manage user groups
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Search user groups or description...'
                        className='block w-full max-w-md px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                    />
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className='inline-flex items-center ml-3 px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-inverse bg-primary hover:bg-primary-dark'
                    >
                        + Create New user group
                    </button>
                </div>
            </div>

            <div className='flex-1 p-6'>
                {filtered.length === 0 ? (
                    <div className='text-center py-12'>
                        <h3 className='text-lg font-medium text-primary mb-2'>
                            No user groups assigned yet!
                        </h3>
                        <div className='mt-4'>
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className='inline-flex items-center px-4 py-2.5 border border-light rounded-lg text-sm text-primary bg-tertiary hover:bg-slate-200 transition'
                            >
                                <span className='mr-2'>+</span> Assign user
                                groups
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {filtered.map((g) => (
                            <div
                                key={g.id}
                                className='border border-light rounded-xl bg-card p-4'
                            >
                                <div className='font-semibold text-primary'>
                                    {g.name}
                                </div>
                                {g.description && (
                                    <div className='text-sm text-secondary mt-1'>
                                        {g.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAssignModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4'>
                    <div className='bg-card rounded-xl shadow-xl w-full max-w-3xl'>
                        <div className='px-6 py-4 border-b border-light flex items-center justify-between'>
                            <h3 className='text-lg font-bold text-primary'>
                                Assign user groups
                            </h3>
                        </div>
                        <div className='p-6'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div>
                                    <label className='block text-sm font-semibold text-primary mb-2'>
                                        Search User Group
                                    </label>
                                    <div className='relative'>
                                        <MagnifyingGlassIcon className='w-5 h-5 text-secondary absolute left-3 top-1/2 -translate-y-1/2' />
                                        <input
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            placeholder='Search here'
                                            className='block w-full pl-10 pr-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className='block text-sm font-semibold text-primary mb-2'>
                                        Search Description
                                    </label>
                                    <div className='relative'>
                                        <MagnifyingGlassIcon className='w-5 h-5 text-secondary absolute left-3 top-1/2 -translate-y-1/2' />
                                        <input
                                            value={desc}
                                            onChange={(e) =>
                                                setDesc(e.target.value)
                                            }
                                            placeholder='Search here'
                                            className='block w-full pl-10 pr-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='flex flex-col items-center justify-center py-10'>
                                <div className='w-28 h-28 grid grid-cols-3 gap-2 opacity-60'>
                                    {Array.from({length: 9}).map((_, i) => (
                                        <div
                                            key={i}
                                            className='w-8 h-8 bg-tertiary rounded-md'
                                        />
                                    ))}
                                </div>
                                <div className='text-secondary mt-6'>
                                    No user groups created yet!
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setShowCreateModal(true);
                                    }}
                                    className='mt-4 inline-flex items-center px-4 py-2 border border-light rounded-lg text-sm text-primary bg-tertiary hover:bg-slate-200'
                                >
                                    <PlusIcon className='w-5 h-5 mr-2' /> Create
                                    User Group
                                </button>
                            </div>
                        </div>
                        <div className='px-6 py-4 border-t border-light flex justify-end gap-2'>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark rounded-lg'
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4'>
                    <div className='bg-card rounded-xl shadow-xl w-full max-w-lg'>
                        <div className='px-6 py-4 border-b border-light flex items-center justify-between'>
                            <h3 className='text-lg font-bold text-primary'>
                                Create user group
                            </h3>
                        </div>
                        <div className='p-6 space-y-4'>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    User group name
                                </label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder='e.g., Developers'
                                    className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Description
                                </label>
                                <textarea
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    rows={3}
                                    className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Select enterprise
                                </label>
                                <select
                                    value={enterprise}
                                    onChange={(e) =>
                                        setEnterprise(e.target.value)
                                    }
                                    className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                                >
                                    <option value=''>
                                        Select an enterprise
                                    </option>
                                    {enterpriseOptions.map((e) => (
                                        <option key={e} value={e}>
                                            {e}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className='px-6 py-4 border-t border-light flex justify-end gap-2'>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                            >
                                Discard
                            </button>
                            <button
                                onClick={createGroup}
                                disabled={!name.trim() || !enterprise.trim()}
                                className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg'
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}