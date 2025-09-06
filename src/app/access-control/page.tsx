'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import ConfirmModal from '@/components/ConfirmModal';
import {ModernDatePicker} from '@/components/ModernDatePicker';
import * as XLSX from 'xlsx';
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    Squares2X2Icon,
    LockClosedIcon,
    LockOpenIcon,
    KeyIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import {api} from '@/utils/api';

interface UserRecord {
    id: string;
    username: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    startDate: string; // ISO yyyy-mm-dd
    endDate?: string; // ISO yyyy-mm-dd
    groupName: string; // assigned to
    updatedAt: string; // ISO timestamp
    status?: 'ACTIVE' | 'INACTIVE';
    locked?: boolean;
}

const DEFAULT_GROUPS = ['Admins', 'Developers', 'QA', 'Ops'];

export default function ManageUsers() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<UserRecord | null>(null);
    const [viewing, setViewing] = useState<UserRecord | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showCreateInline, setShowCreateInline] = useState(false);

    const [modernDatePicker, setModernDatePicker] = useState<{
        isOpen: boolean;
        position: {left: number; top: number};
        field: 'start' | 'end';
        rowKey: string;
        includeTime: boolean;
    }>({
        isOpen: false,
        position: {left: 0, top: 0},
        field: 'start',
        rowKey: '',
        includeTime: false,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {distance: 8},
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    type NewUserDraft = {
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        status: 'ACTIVE' | 'INACTIVE';
        locked: boolean;
        startDate: string; // yyyy-mm-dd
        startTime?: string; // HH:mm
        startUseTime: boolean;
        endDate?: string; // yyyy-mm-dd
        endTime?: string; // HH:mm
        endUseTime: boolean;
        password?: string;
        passwordSet: boolean;
        assignedGroups: string[];
    };
    type DraftRow = NewUserDraft & {key: string};
    const todayIso = (() => {
        const d = new Date();
        const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
        const local = new Date(d.getTime() - tzOffsetMs);
        return local.toISOString().slice(0, 10);
    })();
    const makeBlankDraft = (): DraftRow => ({
        key: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        status: 'ACTIVE',
        locked: false,
        startDate: todayIso,
        startTime: undefined,
        startUseTime: false,
        endDate: undefined,
        endTime: undefined,
        endUseTime: false,
        password: undefined,
        passwordSet: false,
        assignedGroups: [],
    });
    const [newUser, setNewUser] = useState<NewUserDraft>({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        status: 'ACTIVE',
        locked: false,
        startDate: todayIso,
        startTime: undefined,
        startUseTime: false,
        endDate: undefined,
        endTime: undefined,
        endUseTime: false,
        password: undefined,
        passwordSet: false,
        assignedGroups: [],
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const assignableGroups = useMemo(
        () => DEFAULT_GROUPS.filter((g) => !newUser.assignedGroups.includes(g)),
        [newUser.assignedGroups],
    );
    const allPasswordValid = useMemo(() => {
        const pwd = newUser.password || '';
        return (
            pwd.length >= 8 &&
            /\d/.test(pwd) &&
            /[A-Z]/.test(pwd) &&
            /[a-z]/.test(pwd) &&
            /[^A-Za-z0-9]/.test(pwd)
        );
    }, [newUser.password]);
    const passwordsMatch = useMemo(
        () => (newUser.password || '') === confirmPassword,
        [newUser.password, confirmPassword],
    );
    const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
    const [openPasswordPopover, setOpenPasswordPopover] = useState(false);
    const [passwordAnchor, setPasswordAnchor] = useState<HTMLElement | null>(
        null,
    );
    const [passwordKey, setPasswordKey] = useState<string | null>(null);
    const [openDatePopover, setOpenDatePopover] = useState<null | {
        field: 'start' | 'end';
        anchor: HTMLElement;
        key: string;
    }>(null);
    const [groupsHoverOpen, setGroupsHoverOpen] = useState(false);
    const [groupsAnchor, setGroupsAnchor] = useState<HTMLElement | null>(null);
    const [groupsKey, setGroupsKey] = useState<string | null>(null);
    const [assignGroupsOpen, setAssignGroupsOpen] = useState(false);
    const [assignGroupsAnchor, setAssignGroupsAnchor] =
        useState<HTMLElement | null>(null);

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
            'Middle name': u.middleName || '-',
            'Last name': u.lastName,
            Email: u.email,
            'Last updated': new Date(u.updatedAt).toLocaleString(),
            'End date': u.endDate || '-',
            'Assigned to': u.groupName,
            Status: u.status ?? 'ACTIVE',
            Locked: u.locked ? 'Yes' : 'No',
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

    const isDraftSavable = (d: DraftRow) => {
        const fnOk =
            d.firstName.trim().length > 0 && d.firstName.trim().length <= 50;
        const lnOk =
            d.lastName.trim().length > 0 && d.lastName.trim().length <= 50;
        const mnOk = d.middleName.trim().length <= 50;
        const emailOk = !!d.email.trim();
        const startOk = !!d.startDate;
        return fnOk && lnOk && mnOk && emailOk && startOk;
    };

    // Autosave per draft row
    const autosaveTimersRef = useRef<Record<string, any>>({});
    const autosavingKeysRef = useRef<Set<string>>(new Set());
    const scheduleAutosave = (key: string) => {
        const t = autosaveTimersRef.current[key];
        if (t) clearTimeout(t);
        autosaveTimersRef.current[key] = setTimeout(async () => {
            const d = draftRows.find((r) => r.key === key);
            if (!d || !isDraftSavable(d) || autosavingKeysRef.current.has(key))
                return;
            autosavingKeysRef.current.add(key);
            try {
                const username = (d.email || '').split('@')[0] || d.email;
                const payload = {
                    username,
                    firstName: d.firstName.trim(),
                    middleName: d.middleName.trim() || undefined,
                    lastName: d.lastName.trim(),
                    email: d.email.trim(),
                    startDate: d.startDate,
                    endDate: d.endDate || undefined,
                    groupName: d.assignedGroups[0] || DEFAULT_GROUPS[0],
                } as Omit<UserRecord, 'id' | 'updatedAt'>;
                await api.post<UserRecord>('/api/users', payload);
                await loadUsers();
                // Replace the saved draft with a new blank draft to keep adding quickly
                setDraftRows((prev) =>
                    prev.map((r) => (r.key === key ? makeBlankDraft() : r)),
                );
            } catch {
            } finally {
                autosavingKeysRef.current.delete(key);
            }
        }, 600);
    };

    const handleCreateClick = () => {
        setShowCreateInline(true);
        setOpenDatePopover(null);
        setOpenPasswordPopover(false);
        setGroupsHoverOpen(false);
        setDraftRows((prev) => (prev.length === 0 ? [makeBlankDraft()] : prev));
    };
    const [confirmByKey, setConfirmByKey] = useState<Record<string, string>>(
        {},
    );

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
                <div className='flex items-center justify-start gap-2'>
                    <button
                        onClick={handleCreateClick}
                        className='inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-inverse bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200'
                    >
                        <PlusIcon className='h-5 w-5 mr-2' />
                        Create New user
                    </button>

                    <button
                        onClick={() => setShowSearchBar((v) => !v)}
                        className='inline-flex items-center px-3 py-2 border border-light rounded-lg text-sm text-primary bg-tertiary hover:bg-slate-200 transition'
                        title='Toggle search'
                    >
                        <MagnifyingGlassIcon className='h-5 w-5 mr-2' />
                        Search
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-300 ${
                            showSearchBar ? 'w-72 opacity-100' : 'w-0 opacity-0'
                        }`}
                    >
                        <div className='relative w-72'>
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
                    </div>
                    <button
                        className='inline-flex items-center px-3 py-2 border border-light rounded-lg text-sm text-primary bg-tertiary hover:bg-slate-200 transition'
                        title='Filter'
                    >
                        <FunnelIcon className='h-5 w-5 mr-2' /> Filter
                    </button>
                    <button
                        className='inline-flex items-center px-3 py-2 border border-light rounded-lg text-sm text-primary bg-tertiary hover:bg-slate-200 transition'
                        title='Sort'
                    >
                        <ArrowsUpDownIcon className='h-5 w-5 mr-2' /> Sort
                    </button>
                    <button
                        className='inline-flex items-center px-3 py-2 border border-light rounded-lg text-sm text-primary bg-tertiary hover:bg-slate-200 transition'
                        title='Group by'
                    >
                        <Squares2X2Icon className='h-5 w-5 mr-2' /> Group by
                    </button>
                </div>

                {/* inline expanding search input is above; no dropdown */}
            </div>

            <div className='flex-1 p-6'>
                {showCreateInline && (
                    <div className='mb-6 overflow-x-auto bg-white border border-slate-200 rounded-md shadow-sm compact-table safari-tight'>
                        <table className='min-w-full'>
                            <thead>
                                <tr>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        First name *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Middle name
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Last name *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Email address *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Status *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Start date *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        End date
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Password
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Assigned user group
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-200 text-[12px] text-slate-800'>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={({active, over}) => {
                                        if (!over || active.id === over.id)
                                            return;
                                        setDraftRows((prev) => {
                                            const from = prev.findIndex(
                                                (r) => r.key === active.id,
                                            );
                                            const to = prev.findIndex(
                                                (r) => r.key === over.id,
                                            );
                                            return arrayMove(prev, from, to);
                                        });
                                    }}
                                >
                                    <SortableContext
                                        items={draftRows.map((r) => r.key)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {draftRows.map((row) => (
                                            <SortableRow
                                                key={row.key}
                                                rowKey={row.key}
                                                className='row-hover-safe group'
                                            >
                                                <td className='px-3 py-2 border-r border-slate-200'>
                                                    <div className='flex items-center gap-2'>
                                                        <button
                                                            onClick={() => {
                                                                setDraftRows(
                                                                    (prev) =>
                                                                        prev.map(
                                                                            (
                                                                                r,
                                                                            ) =>
                                                                                r.key ===
                                                                                row.key
                                                                                    ? {
                                                                                          ...r,
                                                                                          locked: !r.locked,
                                                                                      }
                                                                                    : r,
                                                                        ),
                                                                );
                                                                scheduleAutosave(
                                                                    row.key,
                                                                );
                                                            }}
                                                            className={`opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center p-1.5 rounded-md border border-light ${
                                                                row.locked
                                                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            }`}
                                                            title={
                                                                row.locked
                                                                    ? 'Unlock'
                                                                    : 'Lock'
                                                            }
                                                        >
                                                            {row.locked ? (
                                                                <LockClosedIcon className='w-4 h-4' />
                                                            ) : (
                                                                <LockOpenIcon className='w-4 h-4' />
                                                            )}
                                                        </button>
                                                        <input
                                                            value={
                                                                row.firstName
                                                            }
                                                            maxLength={50}
                                                            onChange={(e) => {
                                                                setDraftRows(
                                                                    (prev) =>
                                                                        prev.map(
                                                                            (
                                                                                r,
                                                                            ) =>
                                                                                r.key ===
                                                                                row.key
                                                                                    ? {
                                                                                          ...r,
                                                                                          firstName:
                                                                                              e
                                                                                                  .target
                                                                                                  .value,
                                                                                      }
                                                                                    : r,
                                                                        ),
                                                                );
                                                                scheduleAutosave(
                                                                    row.key,
                                                                );
                                                            }}
                                                            className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand'
                                                        />
                                                    </div>
                                                </td>
                                                <td className='px-3 py-2 border-r border-slate-200'>
                                                    <input
                                                        value={row.middleName}
                                                        maxLength={50}
                                                        onChange={(e) => {
                                                            setDraftRows(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (r) =>
                                                                            r.key ===
                                                                            row.key
                                                                                ? {
                                                                                      ...r,
                                                                                      middleName:
                                                                                          e
                                                                                              .target
                                                                                              .value,
                                                                                  }
                                                                                : r,
                                                                    ),
                                                            );
                                                            scheduleAutosave(
                                                                row.key,
                                                            );
                                                        }}
                                                        className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand'
                                                    />
                                                </td>
                                                <td className='px-3 py-2 border-r border-slate-200'>
                                                    <input
                                                        value={row.lastName}
                                                        maxLength={50}
                                                        onChange={(e) => {
                                                            setDraftRows(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (r) =>
                                                                            r.key ===
                                                                            row.key
                                                                                ? {
                                                                                      ...r,
                                                                                      lastName:
                                                                                          e
                                                                                              .target
                                                                                              .value,
                                                                                  }
                                                                                : r,
                                                                    ),
                                                            );
                                                            scheduleAutosave(
                                                                row.key,
                                                            );
                                                        }}
                                                        className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand'
                                                    />
                                                </td>
                                                <td className='px-3 py-2 border-r border-slate-200'>
                                                    <input
                                                        type='email'
                                                        value={row.email}
                                                        onChange={(e) => {
                                                            setDraftRows(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (r) =>
                                                                            r.key ===
                                                                            row.key
                                                                                ? {
                                                                                      ...r,
                                                                                      email: e
                                                                                          .target
                                                                                          .value,
                                                                                  }
                                                                                : r,
                                                                    ),
                                                            );
                                                            scheduleAutosave(
                                                                row.key,
                                                            );
                                                        }}
                                                        className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand'
                                                    />
                                                </td>
                                                <td className='px-3 py-2 border-r border-slate-200'>
                                                    <button
                                                        onClick={() => {
                                                            setDraftRows(
                                                                (prev) =>
                                                                    prev.map(
                                                                        (r) =>
                                                                            r.key ===
                                                                            row.key
                                                                                ? {
                                                                                      ...r,
                                                                                      status:
                                                                                          r.status ===
                                                                                          'ACTIVE'
                                                                                              ? 'INACTIVE'
                                                                                              : 'ACTIVE',
                                                                                  }
                                                                                : r,
                                                                    ),
                                                            );
                                                            scheduleAutosave(
                                                                row.key,
                                                            );
                                                        }}
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                                                            row.status ===
                                                            'ACTIVE'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}
                                                    >
                                                        {row.status}
                                                    </button>
                                                </td>

                                                <td className='px-3 py-2 border-r border-slate-200'>
                                                    <div className='relative group'>
                                                        <input
                                                            type='text'
                                                            value={
                                                                row.startDate
                                                                    ? row.startUseTime &&
                                                                      row.startTime
                                                                        ? `${row.startDate} ${row.startTime}`
                                                                        : row.startDate
                                                                    : ''
                                                            }
                                                            placeholder='Select date'
                                                            readOnly
                                                            className='w-40 px-2 py-1.5 border border-light rounded-md bg-white cursor-pointer text-xs'
                                                        />
                                                        <div className='absolute inset-y-0 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                                            <button
                                                                onClick={() => {
                                                                    const today =
                                                                        new Date()
                                                                            .toISOString()
                                                                            .split(
                                                                                'T',
                                                                            )[0];
                                                                    setDraftRows(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    r,
                                                                                ) =>
                                                                                    r.key ===
                                                                                    row.key
                                                                                        ? {
                                                                                              ...r,
                                                                                              startDate:
                                                                                                  today,
                                                                                              startUseTime:
                                                                                                  false,
                                                                                          }
                                                                                        : r,
                                                                            ),
                                                                    );
                                                                    scheduleAutosave(
                                                                        row.key,
                                                                    );
                                                                }}
                                                                className='inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white shadow text-xs'
                                                                title='Today'
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    const button =
                                                                        e.currentTarget;
                                                                    const rect =
                                                                        button.getBoundingClientRect();
                                                                    setModernDatePicker(
                                                                        {
                                                                            isOpen: true,
                                                                            position:
                                                                                {
                                                                                    left: rect.left,
                                                                                    top:
                                                                                        rect.bottom +
                                                                                        5,
                                                                                },
                                                                            field: 'start',
                                                                            rowKey: row.key,
                                                                            includeTime:
                                                                                row.startUseTime,
                                                                        },
                                                                    );
                                                                }}
                                                                className='inline-flex items-center justify-center w-5 h-5 rounded-md border border-light bg-white text-slate-600'
                                                                title='Calendar'
                                                            >
                                                                <svg
                                                                    className='w-3 h-3'
                                                                    viewBox='0 0 24 24'
                                                                    fill='none'
                                                                    stroke='currentColor'
                                                                    strokeWidth='2'
                                                                >
                                                                    <rect
                                                                        x='3'
                                                                        y='4'
                                                                        width='18'
                                                                        height='18'
                                                                        rx='2'
                                                                    />
                                                                    <path d='M16 2v4M8 2v4M3 10h18' />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='px-3 py-2 border-r border-slate-200'>
                                                    <div className='relative group'>
                                                        <input
                                                            type='text'
                                                            value={
                                                                row.endDate
                                                                    ? row.endUseTime &&
                                                                      row.endTime
                                                                        ? `${row.endDate} ${row.endTime}`
                                                                        : row.endDate
                                                                    : ''
                                                            }
                                                            placeholder='Select date'
                                                            readOnly
                                                            className='w-40 px-2 py-1.5 border border-light rounded-md bg-white cursor-pointer text-xs'
                                                        />
                                                        <div className='absolute inset-y-0 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                                            <button
                                                                onClick={() => {
                                                                    const today =
                                                                        new Date()
                                                                            .toISOString()
                                                                            .split(
                                                                                'T',
                                                                            )[0];
                                                                    setDraftRows(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    r,
                                                                                ) =>
                                                                                    r.key ===
                                                                                    row.key
                                                                                        ? {
                                                                                              ...r,
                                                                                              endDate:
                                                                                                  today,
                                                                                              endUseTime:
                                                                                                  false,
                                                                                          }
                                                                                        : r,
                                                                            ),
                                                                    );
                                                                    scheduleAutosave(
                                                                        row.key,
                                                                    );
                                                                }}
                                                                className='inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white shadow text-xs'
                                                                title='Today'
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    const button =
                                                                        e.currentTarget;
                                                                    const rect =
                                                                        button.getBoundingClientRect();
                                                                    setModernDatePicker(
                                                                        {
                                                                            isOpen: true,
                                                                            position:
                                                                                {
                                                                                    left: rect.left,
                                                                                    top:
                                                                                        rect.bottom +
                                                                                        5,
                                                                                },
                                                                            field: 'end',
                                                                            rowKey: row.key,
                                                                            includeTime:
                                                                                row.endUseTime,
                                                                        },
                                                                    );
                                                                }}
                                                                className='inline-flex items-center justify-center w-5 h-5 rounded-md border border-light bg-white text-slate-600'
                                                                title='Calendar'
                                                            >
                                                                <svg
                                                                    className='w-3 h-3'
                                                                    viewBox='0 0 24 24'
                                                                    fill='none'
                                                                    stroke='currentColor'
                                                                    strokeWidth='2'
                                                                >
                                                                    <rect
                                                                        x='3'
                                                                        y='4'
                                                                        width='18'
                                                                        height='18'
                                                                        rx='2'
                                                                    />
                                                                    <path d='M16 2v4M8 2v4M3 10h18' />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='px-4 py-3'>
                                                    <div className='relative group'>
                                                        <button
                                                            ref={(el) =>
                                                                setPasswordAnchor(
                                                                    el,
                                                                )
                                                            }
                                                            onClick={(e) => {
                                                                setPasswordAnchor(
                                                                    e.currentTarget,
                                                                );
                                                                setPasswordKey(
                                                                    row.key,
                                                                );
                                                                setOpenPasswordPopover(
                                                                    (v) => !v,
                                                                );
                                                            }}
                                                            className={`inline-flex items-center p-2 rounded-md border border-light transition ${
                                                                row.passwordSet
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : 'hover:bg-tertiary/60'
                                                            }`}
                                                            title={
                                                                row.passwordSet
                                                                    ? 'Password set'
                                                                    : 'Set password'
                                                            }
                                                        >
                                                            <KeyIcon className='w-5 h-5' />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className='px-4 py-3'>
                                                    <div className='relative inline-flex items-center gap-2 group'>
                                                        <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200'>
                                                            <UserGroupIcon className='w-4 h-4 mr-1' />
                                                            {row.assignedGroups
                                                                .length > 0
                                                                ? row.assignedGroups.join(
                                                                      ', ',
                                                                  )
                                                                : 'None'}
                                                        </span>
                                                        <button
                                                            className='opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all inline-flex items-center px-2 py-1 text-xs rounded-md border border-light bg-tertiary hover:bg-slate-200'
                                                            onClick={(e) => {
                                                                setAssignGroupsAnchor(
                                                                    e.currentTarget as unknown as HTMLElement,
                                                                );
                                                                setGroupsKey(
                                                                    row.key,
                                                                );
                                                                setAssignGroupsOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                            </SortableRow>
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </tbody>
                        </table>
                        <div
                            className='col-span-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-500 border-t border-dashed border-slate-300 cursor-pointer hover:text-slate-700'
                            onClick={() => {
                                setDraftRows((prev) => [
                                    ...prev,
                                    makeBlankDraft(),
                                ]);
                            }}
                            title='Add new row'
                        >
                            <svg
                                className='w-3.5 h-3.5'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                            >
                                <path d='M4 12h16M12 4v16' strokeWidth='2' />
                            </svg>
                            <span>Add new row</span>
                        </div>
                    </div>
                )}
                {!showCreateInline && filtered.length === 0 ? (
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
                ) : !showCreateInline ? (
                    <div className='overflow-x-auto bg-white border border-slate-200 rounded-md shadow-sm compact-table safari-tight'>
                        <table className='min-w-full'>
                            <thead>
                                <tr>
                                    <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                        Username
                                    </th>
                                    <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                        First name
                                    </th>
                                    <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                        Last name
                                    </th>
                                    <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                        Email
                                    </th>
                                    <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                        Last updated
                                    </th>
                                    <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                        End date
                                    </th>
                                    <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                        Assigned to
                                    </th>
                                    <th className='px-3 py-2 text-right text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-200 text-[12px] text-slate-800'>
                                {filtered.map((u) => (
                                    <tr
                                        key={u.id}
                                        className='transition-all duration-200 hover:bg-indigo-50/40 hover:shadow-[0_2px_12px_-6px_rgba(79,70,229,0.35)]'
                                    >
                                        <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                            {u.username}
                                        </td>
                                        <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                            {u.firstName}
                                        </td>
                                        <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                            {u.lastName}
                                        </td>
                                        <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                            {u.email}
                                        </td>
                                        <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                            {new Date(
                                                u.updatedAt,
                                            ).toLocaleString()}
                                        </td>
                                        <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                            {u.endDate || '-'}
                                        </td>
                                        <td className='px-3 py-2 whitespace-nowrap text-[12px] border-r border-slate-200'>
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
                                        <td className='px-3 py-2 whitespace-nowrap text-right text-[12px]'>
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
                ) : null}
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

            {/* Floating popovers */}
            {openDatePopover && (
                <DatePopover
                    field={openDatePopover.field}
                    anchor={openDatePopover.anchor}
                    minDate={todayIso}
                    valueDate={
                        openDatePopover.field === 'start'
                            ? newUser.startDate
                            : newUser.endDate
                    }
                    valueTime={
                        openDatePopover.field === 'start'
                            ? newUser.startTime
                            : newUser.endTime
                    }
                    useTime={
                        openDatePopover.field === 'start'
                            ? newUser.startUseTime
                            : newUser.endUseTime
                    }
                    onClose={() => setOpenDatePopover(null)}
                    onChange={(date, time, useTime) => {
                        if (openDatePopover.field === 'start') {
                            setNewUser({
                                ...newUser,
                                startDate: date,
                                startTime: time,
                                startUseTime: useTime,
                            });
                        } else {
                            setNewUser({
                                ...newUser,
                                endDate: date || undefined,
                                endTime: time,
                                endUseTime: useTime,
                            });
                        }
                    }}
                />
            )}

            {openPasswordPopover && passwordAnchor && (
                <PasswordPopover
                    anchor={passwordAnchor}
                    password={newUser.password || ''}
                    confirmPassword={confirmPassword}
                    onPasswordChange={(v) =>
                        setNewUser({...newUser, password: v})
                    }
                    onConfirmPasswordChange={setConfirmPassword}
                    onClose={() => setOpenPasswordPopover(false)}
                    onUpdate={() => {
                        if (allPasswordValid && passwordsMatch) {
                            setNewUser({...newUser, passwordSet: true});
                            setOpenPasswordPopover(false);
                        }
                    }}
                />
            )}

            {assignGroupsOpen && assignGroupsAnchor && (
                <AssignGroupsModal
                    anchor={assignGroupsAnchor}
                    onClose={() => setAssignGroupsOpen(false)}
                />
            )}

            {/* Modern Date Picker */}
            {modernDatePicker.isOpen && (
                <ModernDatePicker
                    value={
                        modernDatePicker.field === 'start'
                            ? (() => {
                                  const row = draftRows.find(
                                      (r) => r.key === modernDatePicker.rowKey,
                                  );
                                  return row?.startDate &&
                                      row?.startUseTime &&
                                      row?.startTime
                                      ? `${row.startDate} ${row.startTime}`
                                      : row?.startDate || '';
                              })()
                            : (() => {
                                  const row = draftRows.find(
                                      (r) => r.key === modernDatePicker.rowKey,
                                  );
                                  return row?.endDate &&
                                      row?.endUseTime &&
                                      row?.endTime
                                      ? `${row.endDate} ${row.endTime}`
                                      : row?.endDate || '';
                              })()
                    }
                    includeTime={modernDatePicker.includeTime}
                    onDateChange={(date: string, time?: string) => {
                        setDraftRows((prev) =>
                            prev.map((r) =>
                                r.key === modernDatePicker.rowKey
                                    ? modernDatePicker.field === 'start'
                                        ? {
                                              ...r,
                                              startDate: date,
                                              startTime: time || '09:00',
                                              startUseTime: !!time,
                                          }
                                        : {
                                              ...r,
                                              endDate: date,
                                              endTime: time || '09:00',
                                              endUseTime: !!time,
                                          }
                                    : r,
                            ),
                        );
                        scheduleAutosave(modernDatePicker.rowKey);
                    }}
                    onClose={() =>
                        setModernDatePicker((prev) => ({
                            ...prev,
                            isOpen: false,
                        }))
                    }
                    position={modernDatePicker.position}
                    onTimeToggle={() => {
                        setModernDatePicker((prev) => ({
                            ...prev,
                            includeTime: !prev.includeTime,
                        }));
                        setDraftRows((prev) =>
                            prev.map((r) =>
                                r.key === modernDatePicker.rowKey
                                    ? modernDatePicker.field === 'start'
                                        ? {
                                              ...r,
                                              startUseTime:
                                                  !modernDatePicker.includeTime,
                                          }
                                        : {
                                              ...r,
                                              endUseTime:
                                                  !modernDatePicker.includeTime,
                                          }
                                    : r,
                            ),
                        );
                    }}
                />
            )}
        </div>
    );
}

function SortableRow({
    rowKey,
    children,
    className,
}: {
    rowKey: string;
    children: React.ReactNode;
    className?: string;
}) {
    const {attributes, listeners, setNodeRef, transform, transition} =
        useSortable({id: rowKey});
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'move',
    };
    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={className}
            {...attributes}
            {...listeners}
        >
            {children}
        </tr>
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

function DatePopover({
    field,
    anchor,
    minDate,
    valueDate,
    valueTime,
    useTime,
    onChange,
    onClose,
}: {
    field: 'start' | 'end';
    anchor: HTMLElement;
    minDate: string;
    valueDate?: string;
    valueTime?: string;
    useTime: boolean;
    onChange: (
        date: string,
        time: string | undefined,
        useTime: boolean,
    ) => void;
    onClose: () => void;
}) {
    const [coords, setCoords] = useState<{top: number; left: number} | null>(
        null,
    );
    const [date, setDate] = useState<string>(valueDate || '');
    const [time, setTime] = useState<string>(valueTime || '');
    const [withTime, setWithTime] = useState<boolean>(useTime);

    useEffect(() => {
        const update = () => {
            const rect = anchor.getBoundingClientRect();
            const width = 320;
            const height = 200;
            const spaceBelow = window.innerHeight - rect.bottom;
            const top =
                spaceBelow < height + 8
                    ? rect.top - height - 8
                    : rect.bottom + 8;
            const left = Math.max(
                8,
                Math.min(rect.left, window.innerWidth - width - 8),
            );
            setCoords({top, left});
        };
        update();
        const onWin = () => update();
        setTimeout(update, 0);
        window.addEventListener('resize', onWin);
        window.addEventListener('scroll', onWin, true);
        // keep popover open while interacting: only close when explicitly calling onClose
        const handleDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (anchor.contains(target)) return; // clicking trigger should not close immediately
        };
        window.addEventListener('click', handleDocClick, {capture: true});
        return () => {
            window.removeEventListener('resize', onWin);
            window.removeEventListener('scroll', onWin, true);
            window.removeEventListener('click', handleDocClick, {
                capture: true,
            } as any);
        };
    }, [anchor, onClose]);

    if (!coords) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 70,
                width: 320,
            }}
            className='rounded-xl shadow-xl bg-card border border-light'
            onClick={(e) => e.stopPropagation()}
        >
            <div className='px-4 py-2 border-b border-light flex items-center justify-between'>
                <div className='text-sm font-semibold text-primary'>
                    {field === 'start' ? 'Start date' : 'End date'}
                </div>
                <button
                    onClick={() => setWithTime((v) => !v)}
                    className={`text-xs px-2 py-1 rounded-md border ${
                        withTime
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-tertiary text-primary border-light'
                    }`}
                >
                    Use time
                </button>
            </div>
            <div className='p-4 space-y-3'>
                <div>
                    <input
                        type='date'
                        value={date}
                        min={minDate}
                        onChange={(e) => setDate(e.target.value)}
                        className='w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                    />
                </div>
                {withTime && (
                    <div>
                        <input
                            type='time'
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className='w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                        />
                    </div>
                )}
                <div className='flex justify-end gap-2'>
                    <button
                        onClick={onClose}
                        className='px-3 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!date}
                        onClick={() => {
                            onChange(
                                date,
                                withTime ? time || '00:00' : undefined,
                                withTime,
                            );
                            onClose();
                        }}
                        className='px-3 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg'
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}

function PasswordPopover({
    anchor,
    password,
    confirmPassword,
    onPasswordChange,
    onConfirmPasswordChange,
    onUpdate,
    onClose,
}: {
    anchor: HTMLElement;
    password: string;
    confirmPassword: string;
    onPasswordChange: (v: string) => void;
    onConfirmPasswordChange: (v: string) => void;
    onUpdate: () => void;
    onClose: () => void;
}) {
    const [coords, setCoords] = useState<{top: number; left: number} | null>(
        null,
    );
    useEffect(() => {
        const update = () => {
            const rect = anchor.getBoundingClientRect();
            const width = 340;
            const height = 260;
            const spaceBelow = window.innerHeight - rect.bottom;
            const top =
                spaceBelow < height + 8
                    ? rect.top - height - 8
                    : rect.bottom + 8;
            const left = Math.max(
                8,
                Math.min(rect.left, window.innerWidth - width - 8),
            );
            setCoords({top, left});
        };
        update();
        const onWin = () => update();
        window.addEventListener('resize', onWin);
        window.addEventListener('scroll', onWin, true);
        const handleDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (anchor.contains(target)) return;
        };
        window.addEventListener('click', handleDocClick, {capture: true});
        return () => {
            window.removeEventListener('resize', onWin);
            window.removeEventListener('scroll', onWin, true);
            window.removeEventListener('click', handleDocClick, {
                capture: true,
            } as any);
        };
    }, [anchor, onClose]);

    if (!coords) return null;

    const checks = [
        {label: 'At least 8 characters', ok: password.length >= 8},
        {label: 'At least 1 number', ok: /\d/.test(password)},
        {label: 'At least 1 uppercase letter', ok: /[A-Z]/.test(password)},
        {label: 'At least 1 lowercase letter', ok: /[a-z]/.test(password)},
        {
            label: 'At least 1 special character',
            ok: /[^A-Za-z0-9]/.test(password),
        },
        {label: 'Passwords match', ok: password === confirmPassword},
    ];
    const canUpdate = checks.every((c) => c.ok);

    return (
        <div
            style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 70,
                width: 340,
            }}
            className='rounded-xl shadow-xl bg-card border border-light'
            onClick={(e) => e.stopPropagation()}
        >
            <div className='px-4 py-2 border-b border-light flex items-center gap-2'>
                <InformationCircleIcon className='w-4 h-4 text-secondary' />
                <div className='text-sm font-semibold text-primary'>
                    Enter New Password
                </div>
            </div>
            <div className='p-4 space-y-3'>
                <div>
                    <div className='text-xs font-medium text-secondary mb-1'>
                        New Password
                    </div>
                    <input
                        type='password'
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        className='w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                    />
                </div>
                <div>
                    <div className='text-xs font-medium text-secondary mb-1'>
                        Confirm Password
                    </div>
                    <input
                        type='password'
                        value={confirmPassword}
                        onChange={(e) =>
                            onConfirmPasswordChange(e.target.value)
                        }
                        className='w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                    />
                </div>
                <div className='space-y-1'>
                    {checks.map((c, i) => (
                        <div
                            key={i}
                            className={`text-xs ${
                                c.ok ? 'text-emerald-700' : 'text-secondary'
                            }`}
                        >
                            {c.label}
                        </div>
                    ))}
                </div>
                <div className='flex justify-end gap-2 pt-1'>
                    <button
                        onClick={onClose}
                        className='px-3 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onUpdate}
                        disabled={!canUpdate}
                        className='px-3 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg'
                    >
                        Update password
                    </button>
                </div>
            </div>
        </div>
    );
}

function GroupsHoverPanel({
    anchor,
    assigned,
    assignable,
    onRemove,
    onAdd,
    onClose,
}: {
    anchor: HTMLElement;
    assigned: string[];
    assignable: string[];
    onRemove: (name: string) => void;
    onAdd: (name: string) => void;
    onClose: () => void;
}) {
    const [coords, setCoords] = useState<{top: number; left: number} | null>(
        null,
    );
    useEffect(() => {
        const update = () => {
            const rect = anchor.getBoundingClientRect();
            const width = 360;
            const height = 240;
            const spaceBelow = window.innerHeight - rect.bottom;
            const top =
                spaceBelow < height + 8
                    ? rect.top - height - 8
                    : rect.bottom + 8;
            const left = Math.max(
                8,
                Math.min(rect.left, window.innerWidth - width - 8),
            );
            setCoords({top, left});
        };
        update();
        const onWin = () => update();
        window.addEventListener('resize', onWin);
        window.addEventListener('scroll', onWin, true);
        const handleDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (anchor.contains(target)) return;
        };
        window.addEventListener('click', handleDocClick, {capture: true});
        return () => {
            window.removeEventListener('resize', onWin);
            window.removeEventListener('scroll', onWin, true);
            window.removeEventListener('click', handleDocClick, {
                capture: true,
            } as any);
        };
    }, [anchor, onClose]);

    if (!coords) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 70,
                width: 360,
            }}
            className='rounded-xl shadow-xl bg-card border border-light'
            onClick={(e) => e.stopPropagation()}
        >
            <div className='px-4 py-2 border-b border-light text-sm font-semibold text-primary'>
                Assigned user groups
            </div>
            <div className='p-4 space-y-3 max-h-80 overflow-auto'>
                <div className='space-y-2'>
                    {assigned.length === 0 ? (
                        <div className='text-sm text-secondary'>
                            No groups assigned
                        </div>
                    ) : (
                        assigned.map((g) => (
                            <div
                                key={g}
                                className='flex items-center justify-between border border-light rounded-md px-2 py-1'
                            >
                                <div className='text-sm text-primary'>{g}</div>
                                <button
                                    onClick={() => onRemove(g)}
                                    className='text-xs px-2 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                >
                                    ×
                                </button>
                            </div>
                        ))
                    )}
                </div>
                {assignable.length > 0 && (
                    <div>
                        <div className='text-xs font-semibold text-secondary uppercase tracking-wider mb-1'>
                            Add group
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {assignable.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => onAdd(g)}
                                    className='text-xs px-2 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                >
                                    + {g}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className='flex justify-end pt-1'>
                    <button
                        onClick={onClose}
                        className='px-3 py-1.5 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function AssignGroupsModal({
    anchor,
    onClose,
}: {
    anchor: HTMLElement;
    onClose: () => void;
}) {
    const [coords, setCoords] = useState<{top: number; left: number} | null>(
        null,
    );
    const [query, setQuery] = useState('');
    const [rows, setRows] = useState<
        Array<{
            id: string;
            name: string;
            description?: string;
            entities: string[];
            services: string[];
            roles: string[];
        }>
    >([]);
    const autosaveTimersRef = useRef<Record<string, any>>({});
    const [openEntities, setOpenEntities] = useState<{
        rowId: string;
        anchor: HTMLElement | null;
    } | null>(null);
    const [openServices, setOpenServices] = useState<{
        rowId: string;
        anchor: HTMLElement | null;
    } | null>(null);
    const [openRoles, setOpenRoles] = useState<{
        rowId: string;
        anchor: HTMLElement | null;
    } | null>(null);

    useEffect(() => {
        const rect = anchor.getBoundingClientRect();
        const width = 720;
        const height = 380;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top =
            spaceBelow < height + 8 ? rect.top - height - 8 : rect.bottom + 8;
        const left = Math.max(
            8,
            Math.min(rect.left, window.innerWidth - width - 8),
        );
        setCoords({top, left});
        const onWin = () => setCoords((c) => (c ? {...c} : c));
        window.addEventListener('resize', onWin);
        window.addEventListener('scroll', onWin, true);
        return () => {
            window.removeEventListener('resize', onWin);
            window.removeEventListener('scroll', onWin, true);
        };
    }, [anchor]);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem('assign_groups_rows');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) setRows(parsed);
                else
                    setRows([
                        {
                            id: `row-${Date.now()}`,
                            name: '',
                            description: '',
                            entities: [],
                            services: [],
                            roles: [],
                        },
                    ]);
            } else {
                setRows([
                    {
                        id: `row-${Date.now()}`,
                        name: '',
                        description: '',
                        entities: [],
                        services: [],
                        roles: [],
                    },
                ]);
            }
        } catch {}
    }, []);

    const scheduleAutosave = (id: string) => {
        const t = autosaveTimersRef.current[id];
        if (t) clearTimeout(t);
        autosaveTimersRef.current[id] = setTimeout(() => {
            try {
                window.localStorage.setItem(
                    'assign_groups_rows',
                    JSON.stringify(rows),
                );
            } catch {}
        }, 500);
    };

    const accountId = useMemo(() => {
        try {
            return window.localStorage.getItem('selectedAccountId') || '';
        } catch {
            return '';
        }
    }, []);
    const enterpriseId = useMemo(() => {
        try {
            return window.localStorage.getItem('selectedEnterpriseId') || '';
        } catch {
            return '';
        }
    }, []);

    const fetchEntities = async (search: string) => {
        const url = `/api/business-units/entities?accountId=${encodeURIComponent(
            accountId,
        )}&enterpriseId=${encodeURIComponent(
            enterpriseId,
        )}&q=${encodeURIComponent(search)}`;
        try {
            const list = await api.get<string[]>(url);
            return (list || [])
                .filter((x) => x.toLowerCase().includes(search.toLowerCase()))
                .map((x) => ({id: x, name: x}));
        } catch {
            return [];
        }
    };

    const fetchServices = async (search: string) => {
        try {
            const list = await api.get<Array<{id: string; name: string}>>(
                '/api/services',
            );
            return (list || [])
                .filter((x) =>
                    (x.name || '').toLowerCase().includes(search.toLowerCase()),
                )
                .map((x) => ({id: String(x.id), name: x.name}));
        } catch {
            return [];
        }
    };

    if (!coords) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 70,
                width: 720,
            }}
            className='rounded-xl shadow-xl bg-card border border-light'
            onClick={(e) => e.stopPropagation()}
        >
            <div className='px-4 py-2 border-b border-light flex items-center justify-between bg-gradient-to-r from-indigo-50 to-sky-50'>
                <div className='text-sm font-semibold text-primary'>
                    Assign user groups
                </div>
                <button
                    onClick={onClose}
                    className='px-2 py-1 text-xs rounded-md border border-light hover:bg-tertiary'
                >
                    Close
                </button>
            </div>
            <div className='p-4 space-y-3'>
                <div className='flex items-center gap-2'>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='Search user group'
                        className='w-72 px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                    />
                </div>
                <div className='overflow-auto max-h-72 border border-slate-100 rounded-2xl shadow-sm'>
                    <table className='min-w-full divide-y divide-slate-100'>
                        <thead className='bg-tertiary/60'>
                            <tr>
                                <th className='px-3 py-2 text-left text-xs font-semibold text-secondary uppercase'>
                                    User group name
                                </th>
                                <th className='px-3 py-2 text-left text-xs font-semibold text-secondary uppercase'>
                                    Description
                                </th>
                                <th className='px-3 py-2 text-left text-xs font-semibold text-secondary uppercase'>
                                    Entity
                                </th>
                                <th className='px-3 py-2 text-left text-xs font-semibold text-secondary uppercase'>
                                    Services
                                </th>
                                <th className='px-3 py-2 text-left text-xs font-semibold text-secondary uppercase'>
                                    Roles
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className='transition-all duration-200 hover:bg-indigo-50/40'
                                >
                                    <td className='px-3 py-2 text-sm text-primary'>
                                        <input
                                            value={r.name}
                                            onChange={(e) => {
                                                setRows((prev) =>
                                                    prev.map((x) =>
                                                        x.id === r.id
                                                            ? {
                                                                  ...x,
                                                                  name: e.target
                                                                      .value,
                                                              }
                                                            : x,
                                                    ),
                                                );
                                                scheduleAutosave(r.id);
                                            }}
                                            className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20'
                                        />
                                    </td>
                                    <td className='px-3 py-2 text-sm text-primary'>
                                        <input
                                            value={r.description || ''}
                                            onChange={(e) => {
                                                setRows((prev) =>
                                                    prev.map((x) =>
                                                        x.id === r.id
                                                            ? {
                                                                  ...x,
                                                                  description:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : x,
                                                    ),
                                                );
                                                scheduleAutosave(r.id);
                                            }}
                                            placeholder='Description'
                                            className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20'
                                        />
                                    </td>
                                    <td className='px-3 py-2 text-sm text-primary'>
                                        <div className='group inline-flex items-center gap-2'>
                                            <div className='flex flex-wrap gap-1'>
                                                {r.entities.map((e) => (
                                                    <span
                                                        key={e}
                                                        className='px-2 py-0.5 text-xs rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700'
                                                    >
                                                        {e}
                                                    </span>
                                                ))}
                                            </div>
                                            <button
                                                className='opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all inline-flex items-center px-2 py-1 text-xs rounded-md border border-light bg-tertiary hover:bg-slate-200'
                                                onClick={(e) =>
                                                    setOpenEntities({
                                                        rowId: r.id,
                                                        anchor:
                                                            (e.currentTarget as unknown as HTMLElement) ||
                                                            null,
                                                    })
                                                }
                                            >
                                                +
                                            </button>
                                            {openEntities &&
                                                openEntities.rowId === r.id && (
                                                    <MultiSelectPopover
                                                        anchor={
                                                            openEntities.anchor as HTMLElement
                                                        }
                                                        placeholder='Entity'
                                                        selected={r.entities}
                                                        fetchOptions={
                                                            fetchEntities
                                                        }
                                                        onClose={() =>
                                                            setOpenEntities(
                                                                null,
                                                            )
                                                        }
                                                        onChange={(vals) => {
                                                            setRows((prev) =>
                                                                prev.map((x) =>
                                                                    x.id ===
                                                                    r.id
                                                                        ? {
                                                                              ...x,
                                                                              entities:
                                                                                  vals,
                                                                          }
                                                                        : x,
                                                                ),
                                                            );
                                                            scheduleAutosave(
                                                                r.id,
                                                            );
                                                        }}
                                                    />
                                                )}
                                        </div>
                                    </td>
                                    <td className='px-3 py-2 text-sm text-primary'>
                                        <div className='group inline-flex items-center gap-2'>
                                            <div className='flex flex-wrap gap-1'>
                                                {r.services.map((s) => (
                                                    <span
                                                        key={s}
                                                        className='px-2 py-0.5 text-xs rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                            <button
                                                className='opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all inline-flex items-center px-2 py-1 text-xs rounded-md border border-light bg-tertiary hover:bg-slate-200'
                                                onClick={(e) =>
                                                    setOpenServices({
                                                        rowId: r.id,
                                                        anchor:
                                                            (e.currentTarget as unknown as HTMLElement) ||
                                                            null,
                                                    })
                                                }
                                            >
                                                +
                                            </button>
                                            {openServices &&
                                                openServices.rowId === r.id && (
                                                    <MultiSelectPopover
                                                        anchor={
                                                            openServices.anchor as HTMLElement
                                                        }
                                                        placeholder='Service'
                                                        selected={r.services}
                                                        fetchOptions={
                                                            fetchServices
                                                        }
                                                        onClose={() =>
                                                            setOpenServices(
                                                                null,
                                                            )
                                                        }
                                                        onChange={(vals) => {
                                                            setRows((prev) =>
                                                                prev.map((x) =>
                                                                    x.id ===
                                                                    r.id
                                                                        ? {
                                                                              ...x,
                                                                              services:
                                                                                  vals,
                                                                          }
                                                                        : x,
                                                                ),
                                                            );
                                                            scheduleAutosave(
                                                                r.id,
                                                            );
                                                        }}
                                                    />
                                                )}
                                        </div>
                                    </td>
                                    <td className='px-3 py-2 text-sm text-primary'>
                                        <div className='flex items-center gap-2'>
                                            <svg
                                                className='w-4 h-4 text-slate-500'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                stroke='currentColor'
                                                strokeWidth='2'
                                            >
                                                <path d='M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5 1.343 3.5 3 3.5z' />
                                                <path d='M8 13c-2.761 0-5 2.239-5 5v2h10v-2c0-2.761-2.239-5-5-5z' />
                                                <path d='M8 11c1.657 0 3-1.567 3-3.5S9.657 4 8 4 5 5.567 5 7.5 6.343 11 8 11z' />
                                                <path d='M16 13c-1.486 0-2.816.652-3.711 1.667' />
                                            </svg>
                                            <div className='flex flex-wrap gap-1'>
                                                {r.roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className='px-2 py-0.5 text-xs rounded-full border border-rose-200 bg-rose-50 text-rose-700'
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                            <button
                                                className='ml-auto text-xs px-2 py-1 rounded-md border border-light bg-tertiary hover:bg-slate-200'
                                                onClick={(e) =>
                                                    setOpenRoles({
                                                        rowId: r.id,
                                                        anchor:
                                                            (e.currentTarget as unknown as HTMLElement) ||
                                                            null,
                                                    })
                                                }
                                            >
                                                +
                                            </button>
                                            {openRoles &&
                                                openRoles.rowId === r.id && (
                                                    <RolesPopover
                                                        anchor={
                                                            openRoles.anchor as HTMLElement
                                                        }
                                                        roles={r.roles}
                                                        onAdd={(name) => {
                                                            if (!name.trim())
                                                                return;
                                                            setRows((prev) =>
                                                                prev.map((x) =>
                                                                    x.id ===
                                                                    r.id
                                                                        ? {
                                                                              ...x,
                                                                              roles: Array.from(
                                                                                  new Set(
                                                                                      [
                                                                                          ...x.roles,
                                                                                          name.trim(),
                                                                                      ],
                                                                                  ),
                                                                              ),
                                                                          }
                                                                        : x,
                                                                ),
                                                            );
                                                            scheduleAutosave(
                                                                r.id,
                                                            );
                                                        }}
                                                        onRemove={(name) => {
                                                            setRows((prev) =>
                                                                prev.map((x) =>
                                                                    x.id ===
                                                                    r.id
                                                                        ? {
                                                                              ...x,
                                                                              roles: x.roles.filter(
                                                                                  (
                                                                                      rr,
                                                                                  ) =>
                                                                                      rr !==
                                                                                      name,
                                                                              ),
                                                                          }
                                                                        : x,
                                                                ),
                                                            );
                                                            scheduleAutosave(
                                                                r.id,
                                                            );
                                                        }}
                                                        onClose={() =>
                                                            setOpenRoles(null)
                                                        }
                                                    />
                                                )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className='pt-2'>
                    <button
                        onClick={() =>
                            setRows((prev) => [
                                ...prev,
                                {
                                    id: `row-${Date.now()}`,
                                    name: '',
                                    description: '',
                                    entities: [],
                                    services: [],
                                    roles: [],
                                },
                            ])
                        }
                        className='inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-light bg-tertiary hover:bg-slate-200 text-primary'
                    >
                        + Add new user group
                    </button>
                </div>
            </div>
        </div>
    );
}
function MultiSelectPopover({
    anchor,
    placeholder,
    selected,
    fetchOptions,
    onChange,
    onClose,
}: {
    anchor: HTMLElement;
    placeholder: string;
    selected: string[];
    fetchOptions: (q: string) => Promise<Array<{id: string; name: string}>>;
    onChange: (vals: string[]) => void;
    onClose: () => void;
}) {
    const [coords, setCoords] = useState<{top: number; left: number} | null>(
        null,
    );
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<Array<{id: string; name: string}>>([]);

    useEffect(() => {
        const rect = anchor.getBoundingClientRect();
        const width = 320;
        const height = 280;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top =
            spaceBelow < height + 8 ? rect.top - height - 8 : rect.bottom + 8;
        const left = Math.max(
            8,
            Math.min(rect.left, window.innerWidth - width - 8),
        );
        setCoords({top, left});
        const onWin = () => setCoords((c) => (c ? {...c} : c));
        window.addEventListener('resize', onWin);
        window.addEventListener('scroll', onWin, true);
        return () => {
            window.removeEventListener('resize', onWin);
            window.removeEventListener('scroll', onWin, true);
        };
    }, [anchor]);

    useEffect(() => {
        fetchOptions(query)
            .then((opts) => setItems(opts))
            .catch(() => setItems([]));
    }, [query, fetchOptions]);

    if (!coords) return null;

    const toggle = (id: string, name: string) => {
        const present = selected.includes(name);
        const next = present
            ? selected.filter((x) => x !== name)
            : [...selected, name];
        onChange(next);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 80,
                width: 320,
            }}
            className='rounded-xl shadow-xl bg-card border border-light'
            onClick={(e) => e.stopPropagation()}
        >
            <div className='px-3 py-2 border-b border-light flex items-center justify-between'>
                <div className='text-sm font-semibold text-primary'>
                    Select {placeholder}
                </div>
                <button
                    onClick={onClose}
                    className='text-xs px-2 py-1 rounded-md border border-light hover:bg-tertiary'
                >
                    Close
                </button>
            </div>
            <div className='p-2'>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${placeholder.toLowerCase()}`}
                    className='w-full px-2 py-1.5 border border-light rounded-md mb-2'
                />
                <div className='max-h-56 overflow-auto space-y-1'>
                    {items.map((opt) => {
                        const checked = selected.includes(opt.name);
                        return (
                            <label
                                key={opt.id}
                                className='flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-sm text-primary'
                            >
                                <input
                                    type='checkbox'
                                    checked={checked}
                                    onChange={() => toggle(opt.id, opt.name)}
                                />
                                <span>{opt.name}</span>
                            </label>
                        );
                    })}
                    {items.length === 0 && (
                        <div className='text-sm text-secondary px-2 py-1'>
                            No options
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RolesPopover({
    anchor,
    roles,
    onAdd,
    onRemove,
    onClose,
}: {
    anchor: HTMLElement;
    roles: string[];
    onAdd: (name: string) => void;
    onRemove: (name: string) => void;
    onClose: () => void;
}) {
    const [coords, setCoords] = useState<{top: number; left: number} | null>(
        null,
    );
    const [name, setName] = useState('');

    useEffect(() => {
        const rect = anchor.getBoundingClientRect();
        const width = 320;
        const height = 220;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top =
            spaceBelow < height + 8 ? rect.top - height - 8 : rect.bottom + 8;
        const left = Math.max(
            8,
            Math.min(rect.left, window.innerWidth - width - 8),
        );
        setCoords({top, left});
        const onWin = () => setCoords((c) => (c ? {...c} : c));
        window.addEventListener('resize', onWin);
        window.addEventListener('scroll', onWin, true);
        return () => {
            window.removeEventListener('resize', onWin);
            window.removeEventListener('scroll', onWin, true);
        };
    }, [anchor]);

    if (!coords) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 80,
                width: 320,
            }}
            className='rounded-xl shadow-xl bg-card border border-light'
            onClick={(e) => e.stopPropagation()}
        >
            <div className='px-3 py-2 border-b border-light flex items-center justify-between'>
                <div className='text-sm font-semibold text-primary'>
                    Assigned roles
                </div>
                <button
                    onClick={onClose}
                    className='text-xs px-2 py-1 rounded-md border border-light hover:bg-tertiary'
                >
                    Close
                </button>
            </div>
            <div className='p-3 space-y-2'>
                <div className='flex items-center gap-2'>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='New role name'
                        className='flex-1 px-2 py-1.5 border border-light rounded-md'
                    />
                    <button
                        className='text-xs px-2 py-1 rounded-md border border-light bg-tertiary hover:bg-slate-200'
                        onClick={() => {
                            onAdd(name);
                            setName('');
                        }}
                    >
                        Add
                    </button>
                </div>
                <div className='max-h-40 overflow-auto space-y-1'>
                    {roles.length === 0 ? (
                        <div className='text-sm text-secondary'>No roles</div>
                    ) : (
                        roles.map((r) => (
                            <div
                                key={r}
                                className='flex items-center justify-between px-2 py-1 rounded border border-light'
                            >
                                <div className='text-sm text-primary'>{r}</div>
                                <button
                                    className='text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    onClick={() => onRemove(r)}
                                >
                                    ×
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
