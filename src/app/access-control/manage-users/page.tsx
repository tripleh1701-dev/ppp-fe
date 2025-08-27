'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import * as XLSX from 'xlsx';
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    BookmarkSquareIcon,
} from '@heroicons/react/24/outline';
import {api} from '@/utils/api';

interface UserRecord {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    startDate: string; // ISO yyyy-mm-dd
    endDate?: string; // ISO yyyy-mm-dd
    groupName: string; // assigned to
    updatedAt: string; // ISO timestamp
}

const DEFAULT_GROUPS = ['Admins', 'Developers', 'QA', 'Ops'];

export default function ManageUsers() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<UserRecord | null>(null);
    const [viewing, setViewing] = useState<UserRecord | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const loadUsers = async () => {
        const data = await api.get<UserRecord[]>('/api/users');
        setUsers(data);
    };

    useEffect(() => {
        loadUsers().catch(() => {});
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) =>
            [u.username, u.firstName, u.lastName, u.email, u.groupName]
                .join(' ')
                .toLowerCase()
                .includes(q),
        );
    }, [users, search]);

    const exportToXls = () => {
        const data = filtered.map((u) => ({
            Username: u.username,
            'First name': u.firstName,
            'Last name': u.lastName,
            Email: u.email,
            'Last updated': new Date(u.updatedAt).toLocaleString(),
            'End date': u.endDate || '-',
            'Assigned to': u.groupName,
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        const wbout = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
        const blob = new Blob([wbout], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_export.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const saveVariant = () => {
        alert('View variants will be saved server-side in a future update.');
    };

    const upsertUser = async (
        data: Omit<UserRecord, 'id' | 'updatedAt'>,
        id?: string,
    ) => {
        if (id) {
            await api.put<UserRecord>('/api/users', {...data, id});
        } else {
            await api.post<UserRecord>('/api/users', data);
        }
        await loadUsers();
        setShowModal(false);
        setEditing(null);
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-xl font-bold text-primary'>
                            Manage Users
                        </h1>
                        <p className='text-sm text-secondary mt-1'>
                            Create and manage users and their assignments
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div className='relative flex-1 max-w-md'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <MagnifyingGlassIcon className='h-5 w-5 text-secondary' />
                        </div>
                        <input
                            type='text'
                            placeholder='Search users...'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className='block w-full pl-10 pr-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                        />
                    </div>
                    <div className='flex items-center gap-2 ml-3'>
                        <button
                            onClick={exportToXls}
                            className='inline-flex items-center px-3 py-2 border border-light rounded-lg text-sm text-primary bg-tertiary hover:bg-slate-200 transition'
                            title='Export as XLS'
                        >
                            <ArrowDownTrayIcon className='h-5 w-5 mr-1' />
                            Export XLS
                        </button>
                        <button
                            onClick={saveVariant}
                            className='inline-flex items-center px-3 py-2 border border-light rounded-lg text-sm text-primary bg-tertiary hover:bg-slate-200 transition'
                            title='Save current view as variant'
                        >
                            <BookmarkSquareIcon className='h-5 w-5 mr-1' />
                            Save Variant
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setEditing(null);
                            setShowModal(true);
                        }}
                        className='inline-flex items-center ml-3 px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-inverse bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200'
                    >
                        <PlusIcon className='h-5 w-5 mr-2' />
                        Create New User
                    </button>
                </div>
            </div>

            <div className='flex-1 p-6'>
                {filtered.length === 0 ? (
                    <div className='text-center py-16'>
                        <div className='w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4'>
                            <svg
                                className='w-8 h-8 text-secondary'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
                                />
                            </svg>
                        </div>
                        <h3 className='text-lg font-medium text-primary mb-1'>
                            No users yet
                        </h3>
                        <p className='text-secondary'>
                            Create your first user to get started.
                        </p>
                    </div>
                ) : (
                    <div className='overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm'>
                        <table className='min-w-full divide-y divide-slate-100'>
                            <thead className='bg-tertiary/40'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Username
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        First name
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Last name
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Email
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Last updated
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        End date
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Assigned to
                                    </th>
                                    <th className='px-6 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {filtered.map((u) => (
                                    <tr
                                        key={u.id}
                                        className='transition-all duration-200 hover:bg-indigo-50/40 hover:shadow-[0_2px_12px_-6px_rgba(79,70,229,0.35)]'
                                    >
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                            {u.username}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                            {u.firstName}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                            {u.lastName}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                            {u.email}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                            {new Date(
                                                u.updatedAt,
                                            ).toLocaleString()}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                            {u.endDate || '-'}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                            <button
                                                className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                                onClick={() => {
                                                    const username =
                                                        encodeURIComponent(
                                                            u.username,
                                                        );
                                                    window.location.href = `/access-control/manage-users/groups/${username}`;
                                                }}
                                                title='View assigned user groups'
                                            >
                                                <UserGroupIcon className='w-4 h-4 mr-1' />
                                                {u.groupName}
                                            </button>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm'>
                                            <ActionsMenu
                                                onView={() => setViewing(u)}
                                                onEdit={() => {
                                                    setEditing(u);
                                                    setShowModal(true);
                                                }}
                                                onDelete={() =>
                                                    handleDelete(u.id)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <CreateOrEditUserModal
                    initialValue={editing ?? undefined}
                    onCancel={() => {
                        setShowModal(false);
                        setEditing(null);
                    }}
                    onSave={(data) => upsertUser(data, editing?.id)}
                />
            )}

            {viewing && (
                <ViewUserModal
                    item={viewing}
                    onClose={() => setViewing(null)}
                />
            )}

            <ConfirmModal
                open={pendingDeleteId !== null}
                title='Confirm delete'
                message={`Delete ${(() => {
                    const t = users.find((u) => u.id === pendingDeleteId);
                    return t
                        ? `${t.firstName} ${t.lastName} (${t.username})`
                        : 'this user';
                })()}?\n\nThis action can’t be undone. The item will be permanently removed.`}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={async () => {
                    if (!pendingDeleteId) return;
                    await api.del(`/api/users/${pendingDeleteId}`);
                    await loadUsers();
                    setPendingDeleteId(null);
                }}
            />
        </div>
    );
}

interface CreateOrEditUserModalProps {
    initialValue?: UserRecord;
    onCancel: () => void;
    onSave: (data: Omit<UserRecord, 'id' | 'updatedAt'>) => void;
}

function CreateOrEditUserModal({
    initialValue,
    onCancel,
    onSave,
}: CreateOrEditUserModalProps) {
    const [username, setUsername] = useState(initialValue?.username || '');
    const [firstName, setFirstName] = useState(initialValue?.firstName || '');
    const [lastName, setLastName] = useState(initialValue?.lastName || '');
    const [email, setEmail] = useState(initialValue?.email || '');
    const [startDate, setStartDate] = useState(initialValue?.startDate || '');
    const [endDate, setEndDate] = useState(initialValue?.endDate || '');
    const [groupName, setGroupName] = useState(
        initialValue?.groupName || DEFAULT_GROUPS[0],
    );

    const canSave =
        username.trim() &&
        firstName.trim() &&
        lastName.trim() &&
        email.trim() &&
        startDate.trim();

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4'>
            <div className='bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                <div className='px-6 py-4 border-b border-light flex items-center justify-between'>
                    <h3 className='text-lg font-bold text-primary'>
                        {initialValue ? 'Edit User' : 'Create New User'}
                    </h3>
                    <div className='space-x-2'>
                        <button
                            onClick={onCancel}
                            className='px-3 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg transition-colors duration-200'
                        >
                            Discard
                        </button>
                        <button
                            onClick={() =>
                                onSave({
                                    username,
                                    firstName,
                                    lastName,
                                    email,
                                    startDate,
                                    endDate: endDate || undefined,
                                    groupName,
                                })
                            }
                            disabled={!canSave}
                            className='px-3 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200'
                        >
                            Save
                        </button>
                    </div>
                </div>

                <div className='p-6 space-y-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                Username
                            </label>
                            <input
                                type='text'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                First name
                            </label>
                            <input
                                type='text'
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                Last name
                            </label>
                            <input
                                type='text'
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                Email
                            </label>
                            <input
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                Start date
                            </label>
                            <input
                                type='date'
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                End date
                            </label>
                            <input
                                type='date'
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                            />
                        </div>
                        <div className='md:col-span-2'>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                Assigned to (User Group)
                            </label>
                            <select
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                            >
                                {DEFAULT_GROUPS.map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ViewUserModal({
    item,
    onClose,
}: {
    item: UserRecord;
    onClose: () => void;
}) {
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4'>
            <div className='bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                <div className='px-6 py-4 border-b border-light flex items-center justify-between'>
                    <h3 className='text-lg font-bold text-primary'>
                        View User
                    </h3>
                    <div className='space-x-2'>
                        <button
                            onClick={onClose}
                            className='px-3 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg transition-colors duration-200'
                        >
                            Close
                        </button>
                    </div>
                </div>
                <div className='p-6 space-y-5'>
                    <InfoRow label='Username' value={item.username} />
                    <InfoRow label='First name' value={item.firstName} />
                    <InfoRow label='Last name' value={item.lastName} />
                    <InfoRow label='Email' value={item.email} />
                    <InfoRow label='Start date' value={item.startDate} />
                    <InfoRow label='End date' value={item.endDate || '-'} />
                    <div>
                        <div className='text-xs font-semibold text-secondary uppercase tracking-wider mb-1'>
                            Assigned to
                        </div>
                        <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200'>
                            <UserGroupIcon className='w-4 h-4 mr-1' />
                            {item.groupName}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({label, value}: {label: string; value: string}) {
    return (
        <div>
            <div className='text-xs font-semibold text-secondary uppercase tracking-wider mb-1'>
                {label}
            </div>
            <div className='text-primary'>{value}</div>
        </div>
    );
}

function ActionsMenu({
    onView,
    onEdit,
    onDelete,
}: {
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [coords, setCoords] = useState<{top: number; left: number} | null>(
        null,
    );

    useEffect(() => {
        if (!open) return;
        const el = buttonRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const menuHeight = 160; // approximate
        const menuWidth = 160; // w-40
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < menuHeight + 12;
        const top = openUp
            ? Math.max(8, rect.top - menuHeight - 8)
            : rect.bottom + 8;
        const left = Math.max(
            8,
            Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
        );
        setCoords({top, left});

        const handleGlobal = (e: MouseEvent) => {
            const target = e.target as Node;
            if (buttonRef.current && buttonRef.current.contains(target)) return;
            if (menuRef.current && menuRef.current.contains(target)) return;
            setOpen(false);
        };
        const handleScrollResize = () => setOpen(false);
        window.addEventListener('click', handleGlobal);
        window.addEventListener('scroll', handleScrollResize, true);
        window.addEventListener('resize', handleScrollResize);
        return () => {
            window.removeEventListener('click', handleGlobal);
            window.removeEventListener('scroll', handleScrollResize, true);
            window.removeEventListener('resize', handleScrollResize);
        };
    }, [open]);

    return (
        <div className='relative inline-block text-left'>
            <button
                ref={buttonRef}
                onClick={() => setOpen((v) => !v)}
                className='p-2 rounded-full hover:bg-tertiary/60 border border-light'
                aria-label='Actions'
            >
                <EllipsisVerticalIcon className='w-5 h-5 text-secondary' />
            </button>
            {open && coords && (
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        zIndex: 60,
                    }}
                    className='w-40 rounded-md shadow-lg bg-card border border-light ring-1 ring-black ring-opacity-5 focus:outline-none'
                >
                    <div className='py-1'>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onView();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary/50 flex items-center'
                        >
                            <EyeIcon className='w-4 h-4 mr-2' /> View
                        </button>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onEdit();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary/50 flex items-center'
                        >
                            <PencilSquareIcon className='w-4 h-4 mr-2' /> Edit
                        </button>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onDelete();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center'
                        >
                            <TrashIcon className='w-4 h-4 mr-2' /> Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
