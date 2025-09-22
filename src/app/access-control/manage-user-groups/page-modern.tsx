'use client';

import {useState, useEffect, useMemo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    accessControlApi,
    GroupRecord,
    RoleRecord,
    ServiceRecord,
} from '@/services/accessControlApi';
import {
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    PencilSquareIcon,
    EllipsisVerticalIcon,
    XMarkIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    SparklesIcon,
    CogIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import {
    UserGroupIcon as UserGroupSolidIcon,
    CheckCircleIcon as CheckCircleSolidIcon,
    StarIcon as StarSolidIcon,
} from '@heroicons/react/24/solid';

// Use the GroupRecord from accessControlApi and extend it if needed
interface UserGroupRecord extends GroupRecord {
    group_code?: string;
    status?: 'Active' | 'Inactive';
    account_id?: number;
    enterprise_id?: number;
    entity_name?: string;
    memberCount?: number;
}

export default function ModernManageUserGroups() {
    const [userGroups, setUserGroups] = useState<UserGroupRecord[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [services, setServices] = useState<ServiceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Role assignment states
    const [showRolesDialog, setShowRolesDialog] = useState(false);
    const [selectedGroupForRoles, setSelectedGroupForRoles] =
        useState<UserGroupRecord | null>(null);
    const [groupRoles, setGroupRoles] = useState<RoleRecord[]>([]);
    const [loadingGroupRoles, setLoadingGroupRoles] = useState(false);

    const [assignedGroups, setAssignedGroups] = useState<string[]>([
        '1',
        '3',
        '5',
    ]);
    const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [assignmentProgress, setAssignmentProgress] = useState(0);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log('🚀 Fetching groups, roles, and services...');

                const [groupsData, rolesData, servicesData] = await Promise.all(
                    [
                        accessControlApi.listGroups(),
                        accessControlApi.listRoles(),
                        accessControlApi.listServices(),
                    ],
                );

                console.log('📊 Groups:', groupsData);
                console.log('🔧 Roles:', rolesData);
                console.log('⚙️ Services:', servicesData);

                // Convert GroupRecord to UserGroupRecord format
                const userGroupsData: UserGroupRecord[] = groupsData.map(
                    (group) => ({
                        ...group,
                        status: 'Active' as const,
                        memberCount: 0, // Will need to fetch this separately if needed
                    }),
                );

                setUserGroups(userGroupsData);
                setRoles(rolesData);
                setServices(servicesData);
            } catch (error) {
                console.error('❌ Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate progress
    useEffect(() => {
        setAssignmentProgress(
            Math.floor((assignedGroups.length / userGroups.length) * 100),
        );
    }, [assignedGroups, userGroups]);

    // Handle assignment toggle
    const handleToggleAssignment = (groupId: string) => {
        setAssignedGroups((prev) => {
            return prev.includes(groupId)
                ? prev.filter((id) => id !== groupId)
                : [...prev, groupId];
        });
    };

    // Filter groups based on search
    const filteredGroups = useMemo(() => {
        if (!searchTerm) return userGroups;
        return userGroups.filter(
            (group) =>
                group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (group.description &&
                    group.description
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())) ||
                (group.entity_name &&
                    group.entity_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())),
        );
    }, [userGroups, searchTerm]);

    const handleShowAssignments = (user: any) => {
        setSelectedUser(user);
        setShowAssignmentPanel(true);
    };

    // Handle role assignment dialog
    const handleShowRoles = async (group: UserGroupRecord) => {
        setSelectedGroupForRoles(group);
        setShowRolesDialog(true);
        setLoadingGroupRoles(true);

        try {
            console.log(`🔍 Fetching roles for group: ${group.name}`);
            const groupRolesData = await accessControlApi.getGroupRoles(
                group.id,
            );
            console.log('📋 Group roles:', groupRolesData);
            setGroupRoles(groupRolesData);
        } catch (error) {
            console.error('❌ Error fetching group roles:', error);
            setGroupRoles([]);
        } finally {
            setLoadingGroupRoles(false);
        }
    };

    // Handle role assignment toggle
    const handleToggleRoleAssignment = async (roleId: string) => {
        if (!selectedGroupForRoles) return;

        try {
            const isCurrentlyAssigned = groupRoles.some(
                (role) => role.id === roleId,
            );

            if (isCurrentlyAssigned) {
                // Remove role from group
                await accessControlApi.removeRoleFromGroup(
                    selectedGroupForRoles.id,
                    roleId,
                );
                setGroupRoles((prev) =>
                    prev.filter((role) => role.id !== roleId),
                );
                console.log(
                    `✅ Removed role from group ${selectedGroupForRoles.name}`,
                );
            } else {
                // Add role to group
                await accessControlApi.assignRoleToGroup(
                    selectedGroupForRoles.id,
                    roleId,
                );
                const roleToAdd = roles.find((role) => role.id === roleId);
                if (roleToAdd) {
                    setGroupRoles((prev) => [...prev, roleToAdd]);
                }
                console.log(
                    `✅ Assigned role to group ${selectedGroupForRoles.name}`,
                );
            }
        } catch (error) {
            console.error('❌ Error toggling role assignment:', error);
        }
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
            {/* Modern Header */}
            <div className='bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm sticky top-0 z-30'>
                <div className='max-w-7xl mx-auto px-6 py-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <motion.div
                                initial={{scale: 0, rotate: -180}}
                                animate={{scale: 1, rotate: 0}}
                                transition={{duration: 0.6, type: 'spring'}}
                                className='p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg'
                            >
                                <UserGroupSolidIcon className='h-8 w-8 text-white' />
                            </motion.div>
                            <div>
                                <motion.h1
                                    initial={{opacity: 0, x: -20}}
                                    animate={{opacity: 1, x: 0}}
                                    className='text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
                                >
                                    User Groups Management
                                </motion.h1>
                                <motion.p
                                    initial={{opacity: 0, x: -20}}
                                    animate={{opacity: 1, x: 0}}
                                    transition={{delay: 0.1}}
                                    className='text-sm text-slate-500 mt-1 flex items-center gap-4'
                                >
                                    <span className='inline-flex items-center gap-1'>
                                        <CogIcon className='h-4 w-4' />
                                        Systiva Corporation
                                    </span>
                                    <span className='w-1 h-1 bg-slate-300 rounded-full'></span>
                                    <span className='inline-flex items-center gap-1'>
                                        <SparklesIcon className='h-4 w-4' />
                                        Enterprise Solutions
                                    </span>
                                </motion.p>
                            </div>
                        </div>

                        {/* Beautiful Assignment Status Button */}
                        <motion.button
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{opacity: 1, scale: 1}}
                            transition={{delay: 0.3, type: 'spring'}}
                            whileHover={{scale: 1.02, y: -2}}
                            whileTap={{scale: 0.98}}
                            onClick={() =>
                                handleShowAssignments({
                                    name: 'Administrator',
                                    role: 'System Admin',
                                })
                            }
                            className='group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-medium shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden'
                        >
                            {/* Animated background */}
                            <div className='absolute inset-0 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

                            <div className='relative flex items-center gap-4'>
                                <div className='p-2 bg-white/20 backdrop-blur-sm rounded-xl'>
                                    <UserGroupSolidIcon className='h-6 w-6' />
                                </div>
                                <div className='text-left'>
                                    <div className='text-lg font-bold'>
                                        User Assignments
                                    </div>
                                    <div className='text-sm text-blue-100'>
                                        {assignedGroups.length} of{' '}
                                        {userGroups.length} groups assigned
                                    </div>
                                </div>

                                {/* Circular Progress Ring */}
                                <div className='relative'>
                                    <svg
                                        className='w-16 h-16 transform -rotate-90'
                                        viewBox='0 0 64 64'
                                    >
                                        <circle
                                            cx='32'
                                            cy='32'
                                            r='28'
                                            fill='none'
                                            stroke='rgba(255,255,255,0.2)'
                                            strokeWidth='4'
                                        />
                                        <motion.circle
                                            cx='32'
                                            cy='32'
                                            r='28'
                                            fill='none'
                                            stroke='white'
                                            strokeWidth='4'
                                            strokeLinecap='round'
                                            initial={{
                                                strokeDasharray: '0 175.9',
                                            }}
                                            animate={{
                                                strokeDasharray: `${
                                                    (assignmentProgress / 100) *
                                                    175.9
                                                } 175.9`,
                                            }}
                                            transition={{
                                                duration: 1,
                                                ease: 'easeOut',
                                            }}
                                        />
                                    </svg>
                                    <div className='absolute inset-0 flex items-center justify-center'>
                                        <div className='text-center'>
                                            <div className='text-lg font-bold text-white'>
                                                {assignmentProgress}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='max-w-7xl mx-auto p-6'>
                {/* Search and Actions Bar */}
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.2}}
                    className='bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 mb-8'
                >
                    <div className='flex items-center justify-between gap-6'>
                        <div className='flex-1 max-w-lg'>
                            <div className='relative'>
                                <MagnifyingGlassIcon className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400' />
                                <input
                                    type='text'
                                    placeholder='Search user groups, descriptions, entities...'
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className='w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 placeholder-slate-400'
                                />
                            </div>
                        </div>
                        <div className='flex items-center gap-4'>
                            <motion.button
                                whileHover={{scale: 1.05, rotate: 5}}
                                whileTap={{scale: 0.95}}
                                className='p-4 bg-white/80 backdrop-blur-sm hover:bg-slate-100/80 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg'
                            >
                                <FunnelIcon className='h-5 w-5 text-slate-600' />
                            </motion.button>
                            <motion.button
                                whileHover={{scale: 1.02, y: -1}}
                                whileTap={{scale: 0.98}}
                                className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3'
                            >
                                <PlusIcon className='h-5 w-5' />
                                Add New Group
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Modern User Groups Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'>
                    <AnimatePresence mode='wait'>
                        {filteredGroups.map((group, index) => {
                            const isAssigned = assignedGroups.includes(
                                group.id,
                            );
                            return (
                                <motion.div
                                    key={group.id}
                                    layout
                                    initial={{opacity: 0, y: 20, scale: 0.9}}
                                    animate={{opacity: 1, y: 0, scale: 1}}
                                    exit={{opacity: 0, y: -20, scale: 0.9}}
                                    transition={{
                                        delay: index * 0.1,
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                    whileHover={{y: -8, scale: 1.02}}
                                    className={`
                                        group relative bg-white/80 backdrop-blur-xl rounded-3xl border-2 transition-all duration-500 cursor-pointer overflow-hidden
                                        ${
                                            isAssigned
                                                ? 'border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 shadow-blue-100/50 shadow-xl'
                                                : 'border-slate-200/60 hover:border-blue-300/60 hover:shadow-xl hover:shadow-slate-200/50'
                                        }
                                    `}
                                    onClick={() =>
                                        handleToggleAssignment(group.id)
                                    }
                                >
                                    {/* Gradient overlay for assigned items */}
                                    {isAssigned && (
                                        <motion.div
                                            initial={{opacity: 0}}
                                            animate={{opacity: 1}}
                                            className='absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 pointer-events-none'
                                        />
                                    )}

                                    {/* Card Content */}
                                    <div className='relative p-8'>
                                        {/* Header */}
                                        <div className='flex items-start justify-between mb-6'>
                                            <motion.div
                                                whileHover={{
                                                    scale: 1.1,
                                                    rotate: 5,
                                                }}
                                                className={`
                                                    p-4 rounded-2xl transition-all duration-300 shadow-lg
                                                    ${
                                                        isAssigned
                                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25'
                                                            : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 group-hover:shadow-blue-200/50'
                                                    }
                                                `}
                                            >
                                                {isAssigned ? (
                                                    <CheckCircleSolidIcon className='h-7 w-7' />
                                                ) : (
                                                    <UserGroupIcon className='h-7 w-7' />
                                                )}
                                            </motion.div>

                                            <div className='flex items-center gap-2'>
                                                <span
                                                    className={`
                                                    px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm
                                                    ${
                                                        group.status ===
                                                        'Active'
                                                            ? 'bg-emerald-100 text-emerald-700 shadow-emerald-200/50'
                                                            : 'bg-red-100 text-red-700 shadow-red-200/50'
                                                    }
                                                `}
                                                >
                                                    {group.status}
                                                </span>
                                                <motion.button
                                                    whileHover={{scale: 1.1}}
                                                    whileTap={{scale: 0.9}}
                                                    className='p-2 hover:bg-slate-100 rounded-xl transition-colors'
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <EllipsisVerticalIcon className='h-4 w-4 text-slate-400' />
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* Group Details */}
                                        <div className='mb-6'>
                                            <h3
                                                className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                                                    isAssigned
                                                        ? 'text-blue-900'
                                                        : 'text-slate-900 group-hover:text-blue-600'
                                                }`}
                                            >
                                                {group.name}
                                            </h3>
                                            <p className='text-sm text-slate-600 leading-relaxed line-clamp-2'>
                                                {group.description}
                                            </p>
                                        </div>

                                        {/* Group Info Grid */}
                                        <div className='space-y-3 mb-6'>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-sm text-slate-500 font-medium'>
                                                    Entity
                                                </span>
                                                <span className='text-sm font-semibold text-slate-700 bg-slate-100/80 backdrop-blur-sm px-3 py-1.5 rounded-xl'>
                                                    {group.entity_name}
                                                </span>
                                            </div>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-sm text-slate-500 font-medium'>
                                                    Members
                                                </span>
                                                <span className='text-sm font-semibold text-slate-700 flex items-center gap-2'>
                                                    <UsersIcon className='h-4 w-4 text-blue-500' />
                                                    {group.memberCount}
                                                </span>
                                            </div>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-sm text-slate-500 font-medium'>
                                                    Code
                                                </span>
                                                <span className='text-xs font-mono bg-slate-100/80 backdrop-blur-sm px-3 py-1.5 rounded-xl text-slate-600 font-semibold'>
                                                    {group.group_code}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className='flex items-center gap-2'>
                                            <motion.button
                                                whileHover={{scale: 1.05}}
                                                whileTap={{scale: 0.95}}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShowRoles(group);
                                                }}
                                                className='flex-1 p-3 bg-green-100/80 hover:bg-green-200/80 rounded-xl transition-all duration-300 flex items-center justify-center gap-2'
                                            >
                                                <CogIcon className='h-4 w-4 text-green-600' />
                                                <span className='text-sm font-medium text-green-700'>
                                                    Roles
                                                </span>
                                            </motion.button>
                                            <motion.button
                                                whileHover={{scale: 1.05}}
                                                whileTap={{scale: 0.95}}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className='flex-1 p-3 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition-all duration-300 flex items-center justify-center gap-2'
                                            >
                                                <EyeIcon className='h-4 w-4 text-slate-600' />
                                                <span className='text-sm font-medium text-slate-700'>
                                                    View
                                                </span>
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Assignment Status Indicator */}
                                    {isAssigned && (
                                        <motion.div
                                            initial={{scaleX: 0}}
                                            animate={{scaleX: 1}}
                                            className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {filteredGroups.length === 0 && (
                    <motion.div
                        initial={{opacity: 0, scale: 0.9}}
                        animate={{opacity: 1, scale: 1}}
                        className='text-center py-20 bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20'
                    >
                        <motion.div
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            transition={{delay: 0.2, type: 'spring'}}
                            className='p-6 bg-gradient-to-r from-slate-100 to-blue-100 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center'
                        >
                            <UserGroupIcon className='h-12 w-12 text-slate-400' />
                        </motion.div>
                        <h3 className='text-2xl font-bold text-slate-900 mb-4'>
                            No user groups found
                        </h3>
                        <p className='text-slate-500 mb-8 max-w-md mx-auto leading-relaxed'>
                            {searchTerm
                                ? "Try adjusting your search terms to find what you're looking for"
                                : 'Create your first user group to get started with access management'}
                        </p>
                        <motion.button
                            whileHover={{scale: 1.05, y: -2}}
                            whileTap={{scale: 0.95}}
                            className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300'
                        >
                            Create User Group
                        </motion.button>
                    </motion.div>
                )}
            </div>

            {/* Ultra-Modern Sliding Assignment Panel */}
            <AnimatePresence>
                {showAssignmentPanel && (
                    <>
                        {/* Enhanced Backdrop */}
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{duration: 0.3}}
                            className='fixed inset-0 bg-black/40 backdrop-blur-md z-40'
                            onClick={() => setShowAssignmentPanel(false)}
                        />

                        {/* Ultra-Modern Sliding Panel */}
                        <motion.div
                            initial={{x: '100%', opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            exit={{x: '100%', opacity: 0}}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                                duration: 0.6,
                            }}
                            className='fixed right-0 top-0 h-full w-[480px] bg-white/95 backdrop-blur-2xl shadow-2xl z-50 flex flex-col border-l border-white/20'
                        >
                            {/* Panel Header with Animated Gradient */}
                            <div className='relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 overflow-hidden'>
                                {/* Animated background particles */}
                                <div className='absolute inset-0 opacity-20'>
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className='absolute w-2 h-2 bg-white rounded-full'
                                            animate={{
                                                x: [0, 100, 0],
                                                y: [0, -50, 0],
                                                opacity: [0, 1, 0],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                delay: i * 0.5,
                                            }}
                                            style={{
                                                left: `${20 + i * 15}%`,
                                                top: `${30 + i * 10}%`,
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className='relative'>
                                    <div className='flex items-center justify-between mb-8'>
                                        <div className='flex items-center gap-4'>
                                            <motion.div
                                                initial={{
                                                    scale: 0,
                                                    rotate: -180,
                                                }}
                                                animate={{scale: 1, rotate: 0}}
                                                transition={{
                                                    duration: 0.6,
                                                    type: 'spring',
                                                }}
                                                className='p-4 bg-white/20 backdrop-blur-sm rounded-2xl'
                                            >
                                                <UserGroupSolidIcon className='h-8 w-8' />
                                            </motion.div>
                                            <div>
                                                <motion.h3
                                                    initial={{
                                                        opacity: 0,
                                                        x: -20,
                                                    }}
                                                    animate={{opacity: 1, x: 0}}
                                                    className='text-2xl font-bold'
                                                >
                                                    Assignment Manager
                                                </motion.h3>
                                                <motion.p
                                                    initial={{
                                                        opacity: 0,
                                                        x: -20,
                                                    }}
                                                    animate={{opacity: 1, x: 0}}
                                                    transition={{delay: 0.1}}
                                                    className='text-blue-100 text-sm'
                                                >
                                                    {selectedUser?.name ||
                                                        'Administrator'}{' '}
                                                    •{' '}
                                                    {selectedUser?.role ||
                                                        'System Management'}
                                                </motion.p>
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{
                                                scale: 1.1,
                                                rotate: 90,
                                            }}
                                            whileTap={{scale: 0.9}}
                                            onClick={() =>
                                                setShowAssignmentPanel(false)
                                            }
                                            className='p-3 hover:bg-white/20 rounded-2xl transition-all duration-300'
                                        >
                                            <XMarkIcon className='h-6 w-6' />
                                        </motion.button>
                                    </div>

                                    {/* Ultra-Modern Progress Display */}
                                    <motion.div
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{delay: 0.3}}
                                        className='bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20'
                                    >
                                        <div className='flex items-center justify-between mb-4'>
                                            <span className='text-lg font-semibold'>
                                                Assignment Progress
                                            </span>
                                            <div className='flex items-center gap-2'>
                                                <StarSolidIcon className='h-5 w-5 text-yellow-300' />
                                                <span className='text-sm text-blue-100 font-medium'>
                                                    {assignedGroups.length > 3
                                                        ? 'Excellent Coverage!'
                                                        : 'Good Progress'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-4 mb-4'>
                                            <span className='text-sm text-blue-100'>
                                                {assignedGroups.length} of{' '}
                                                {userGroups.length} groups
                                                assigned
                                            </span>
                                            <div className='flex-1 relative h-4 bg-white/20 rounded-full overflow-hidden'>
                                                <motion.div
                                                    initial={{width: 0}}
                                                    animate={{
                                                        width: `${assignmentProgress}%`,
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        ease: 'easeOut',
                                                    }}
                                                    className='absolute left-0 top-0 h-full bg-gradient-to-r from-white via-blue-200 to-indigo-200 rounded-full'
                                                />
                                                <motion.div
                                                    animate={{
                                                        x: ['0%', '100%', '0%'],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: 'easeInOut',
                                                    }}
                                                    className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
                                                />
                                            </div>
                                            <span className='text-lg font-bold text-white min-w-[3rem]'>
                                                {assignmentProgress}%
                                            </span>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Panel Content with Enhanced Cards */}
                            <div className='flex-1 overflow-y-auto p-6'>
                                <div className='space-y-4'>
                                    {userGroups.map((group, index) => {
                                        const isAssigned =
                                            assignedGroups.includes(group.id);
                                        return (
                                            <motion.div
                                                key={group.id}
                                                initial={{
                                                    opacity: 0,
                                                    x: 30,
                                                    scale: 0.95,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                    scale: 1,
                                                }}
                                                transition={{
                                                    delay: index * 0.08,
                                                    type: 'spring',
                                                    stiffness: 300,
                                                    damping: 30,
                                                }}
                                                whileHover={{
                                                    scale: 1.02,
                                                    y: -2,
                                                }}
                                                className={`
                                                    group relative p-6 rounded-3xl border-2 transition-all duration-500 cursor-pointer backdrop-blur-xl
                                                    ${
                                                        isAssigned
                                                            ? 'border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 shadow-lg shadow-blue-100/50'
                                                            : 'border-slate-200/60 bg-white/60 hover:border-blue-300/60 hover:shadow-lg hover:shadow-slate-200/50'
                                                    }
                                                `}
                                                onClick={() =>
                                                    handleToggleAssignment(
                                                        group.id,
                                                    )
                                                }
                                            >
                                                <div className='flex items-center gap-5'>
                                                    <motion.div
                                                        whileHover={{
                                                            scale: 1.15,
                                                            rotate: 10,
                                                        }}
                                                        whileTap={{scale: 0.9}}
                                                        className={`
                                                            p-4 rounded-2xl transition-all duration-300 shadow-lg
                                                            ${
                                                                isAssigned
                                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30'
                                                                    : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 group-hover:shadow-blue-200/50'
                                                            }
                                                        `}
                                                    >
                                                        {isAssigned ? (
                                                            <CheckCircleSolidIcon className='h-7 w-7' />
                                                        ) : (
                                                            <UserGroupIcon className='h-7 w-7' />
                                                        )}
                                                    </motion.div>

                                                    <div className='flex-1 min-w-0'>
                                                        <h4
                                                            className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                                                                isAssigned
                                                                    ? 'text-blue-900'
                                                                    : 'text-slate-900 group-hover:text-blue-600'
                                                            }`}
                                                        >
                                                            {group.name}
                                                        </h4>
                                                        <p className='text-sm text-slate-600 mb-3 line-clamp-1'>
                                                            {group.description}
                                                        </p>
                                                        <div className='flex items-center gap-3'>
                                                            <span className='text-xs bg-slate-100/80 backdrop-blur-sm text-slate-600 px-3 py-1.5 rounded-xl font-medium'>
                                                                {
                                                                    group.entity_name
                                                                }
                                                            </span>
                                                            <span
                                                                className={`
                                                                text-xs px-3 py-1.5 rounded-xl font-semibold
                                                                ${
                                                                    group.status ===
                                                                    'Active'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : 'bg-red-100 text-red-700'
                                                                }
                                                            `}
                                                            >
                                                                {group.status}
                                                            </span>
                                                            <span className='text-xs text-slate-500 flex items-center gap-1'>
                                                                <UsersIcon className='h-3 w-3' />
                                                                {
                                                                    group.memberCount
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <motion.div
                                                        animate={{
                                                            rotate: isAssigned
                                                                ? 90
                                                                : 0,
                                                        }}
                                                        transition={{
                                                            duration: 0.3,
                                                        }}
                                                        className={`transition-colors duration-300 ${
                                                            isAssigned
                                                                ? 'text-blue-600'
                                                                : 'text-slate-400'
                                                        }`}
                                                    >
                                                        <ChevronRightIcon className='h-6 w-6' />
                                                    </motion.div>
                                                </div>

                                                {/* Enhanced Assignment Indicator */}
                                                {isAssigned && (
                                                    <motion.div
                                                        initial={{
                                                            scaleX: 0,
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            scaleX: 1,
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            duration: 0.5,
                                                            ease: 'easeOut',
                                                        }}
                                                        className='absolute bottom-0 left-6 right-6 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full'
                                                    />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Enhanced Panel Footer */}
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.5}}
                                className='border-t border-slate-200/60 p-6 bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-xl'
                            >
                                <div className='flex gap-4'>
                                    <motion.button
                                        whileHover={{scale: 1.02, y: -1}}
                                        whileTap={{scale: 0.98}}
                                        onClick={() =>
                                            setShowAssignmentPanel(false)
                                        }
                                        className='flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300'
                                    >
                                        Save Changes
                                    </motion.button>
                                    <motion.button
                                        whileHover={{scale: 1.02, y: -1}}
                                        whileTap={{scale: 0.98}}
                                        onClick={() =>
                                            setShowAssignmentPanel(false)
                                        }
                                        className='px-8 bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 py-4 rounded-2xl font-semibold transition-all duration-300'
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Roles Assignment Dialog */}
            <AnimatePresence>
                {showRolesDialog && selectedGroupForRoles && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            onClick={() => setShowRolesDialog(false)}
                            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50'
                        />

                        {/* Dialog */}
                        <motion.div
                            initial={{opacity: 0, scale: 0.9, y: 20}}
                            animate={{opacity: 1, scale: 1, y: 0}}
                            exit={{opacity: 0, scale: 0.9, y: 20}}
                            className='fixed inset-0 z-50 flex items-center justify-center p-6'
                        >
                            <div className='bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
                                {/* Header */}
                                <div className='bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white'>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                            <CogIcon className='h-6 w-6' />
                                            <h2 className='text-xl font-bold'>
                                                Assign Roles
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setShowRolesDialog(false)
                                            }
                                            className='p-2 hover:bg-white/20 rounded-xl transition-colors'
                                        >
                                            <XMarkIcon className='h-5 w-5' />
                                        </button>
                                    </div>
                                    <p className='text-green-100 mt-2'>
                                        Configure user roles for{' '}
                                        {selectedGroupForRoles.name}
                                    </p>
                                </div>

                                {/* Content */}
                                <div className='p-6'>
                                    {/* Column Headers */}
                                    <div className='grid grid-cols-4 gap-4 mb-4 text-sm font-semibold text-slate-600 border-b pb-3'>
                                        <div></div>
                                        <div className='flex items-center gap-2'>
                                            <CogIcon className='h-4 w-4' />
                                            Role Name
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <SparklesIcon className='h-4 w-4' />
                                            Role Description
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <CheckCircleIcon className='h-4 w-4' />
                                            Scope
                                        </div>
                                    </div>

                                    {/* Roles List */}
                                    <div className='space-y-3 max-h-96 overflow-y-auto'>
                                        {loadingGroupRoles ? (
                                            <div className='flex items-center justify-center py-12'>
                                                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
                                            </div>
                                        ) : (
                                            roles.map((role) => {
                                                const isAssigned =
                                                    groupRoles.some(
                                                        (gr) =>
                                                            gr.id === role.id,
                                                    );
                                                return (
                                                    <motion.div
                                                        key={role.id}
                                                        initial={{
                                                            opacity: 0,
                                                            x: -20,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            x: 0,
                                                        }}
                                                        className={`grid grid-cols-4 gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                                            isAssigned
                                                                ? 'border-green-200 bg-green-50'
                                                                : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'
                                                        }`}
                                                        onClick={() =>
                                                            handleToggleRoleAssignment(
                                                                role.id,
                                                            )
                                                        }
                                                    >
                                                        <div className='flex items-center'>
                                                            <input
                                                                type='checkbox'
                                                                checked={
                                                                    isAssigned
                                                                }
                                                                onChange={() =>
                                                                    handleToggleRoleAssignment(
                                                                        role.id,
                                                                    )
                                                                }
                                                                className='w-5 h-5 text-green-600 rounded focus:ring-green-500'
                                                            />
                                                        </div>
                                                        <div className='font-semibold text-slate-900'>
                                                            {role.name}
                                                        </div>
                                                        <div className='text-slate-600'>
                                                            {role.description ||
                                                                'No description available'}
                                                        </div>
                                                        <div className='flex items-center gap-1'>
                                                            <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium'>
                                                                {role.permissions.join(
                                                                    ', ',
                                                                )}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Add Button */}
                                    <div className='mt-6 flex justify-center'>
                                        <button className='flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors'>
                                            <PlusIcon className='h-4 w-4' />
                                            Add item
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
