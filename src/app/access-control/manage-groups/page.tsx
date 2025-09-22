'use client';

import {useEffect, useState} from 'react';
import {
    accessControlApi,
    GroupRecord,
    UserRecord,
    RoleRecord,
} from '@/services/accessControlApi';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Users,
    Shield,
    UserPlus,
    UserMinus,
} from 'lucide-react';

export default function ManageGroups() {
    const [groups, setGroups] = useState<GroupRecord[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);
    const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<GroupRecord | null>(
        null,
    );
    const [groupUsers, setGroupUsers] = useState<UserRecord[]>([]);
    const [groupRoles, setGroupRoles] = useState<RoleRecord[]>([]);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showRolesModal, setShowRolesModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const loadGroups = async () => {
        try {
            setLoading(true);
            const data = await accessControlApi.listGroups(search);
            setGroups(data);
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGroupUsers = async (groupId: string) => {
        try {
            const users = await accessControlApi.getGroupUsers(groupId);
            setGroupUsers(users);
        } catch (error) {
            console.error('Error loading group users:', error);
            setGroupUsers([]);
        }
    };

    const loadGroupRoles = async (groupId: string) => {
        try {
            const roles = await accessControlApi.getGroupRoles(groupId);
            setGroupRoles(roles);
        } catch (error) {
            console.error('Error loading group roles:', error);
            setGroupRoles([]);
        }
    };

    useEffect(() => {
        loadGroups();
    }, [search]);

    const handleCreateGroup = async () => {
        try {
            setLoading(true);
            await accessControlApi.createGroup(formData);
            setFormData({name: '', description: ''});
            setShowCreateModal(false);
            await loadGroups();
        } catch (error) {
            console.error('Error creating group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGroup = async () => {
        if (!editingGroup) return;

        try {
            setLoading(true);
            await accessControlApi.updateGroup(editingGroup.id, formData);
            setFormData({name: '', description: ''});
            setEditingGroup(null);
            await loadGroups();
        } catch (error) {
            console.error('Error updating group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!deleteGroupId) return;

        try {
            setLoading(true);
            await accessControlApi.deleteGroup(deleteGroupId);
            setDeleteGroupId(null);
            await loadGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (group: GroupRecord) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description || '',
        });
    };

    const openUsersModal = async (group: GroupRecord) => {
        setSelectedGroup(group);
        await loadGroupUsers(group.id);
        setShowUsersModal(true);
    };

    const openRolesModal = async (group: GroupRecord) => {
        setSelectedGroup(group);
        await loadGroupRoles(group.id);
        setShowRolesModal(true);
    };

    const filteredGroups = groups.filter(
        (group) =>
            group.name.toLowerCase().includes(search.toLowerCase()) ||
            (group.description &&
                group.description.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <div className='h-full bg-secondary flex flex-col'>
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-xl font-bold text-primary'>
                            Manage Groups
                        </h1>
                        <p className='text-sm text-secondary mt-1'>
                            Create and manage user groups and their permissions
                        </p>
                    </div>
                    <Dialog
                        open={showCreateModal}
                        onOpenChange={setShowCreateModal}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className='h-4 w-4 mr-2' />
                                Add Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Group</DialogTitle>
                            </DialogHeader>
                            <div className='space-y-4'>
                                <div>
                                    <Label htmlFor='name'>Group Name</Label>
                                    <Input
                                        id='name'
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder='Enter group name'
                                    />
                                </div>
                                <div>
                                    <Label htmlFor='description'>
                                        Description
                                    </Label>
                                    <Textarea
                                        id='description'
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder='Enter group description'
                                    />
                                </div>
                                <div className='flex justify-end space-x-2'>
                                    <Button
                                        variant='outline'
                                        onClick={() =>
                                            setShowCreateModal(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateGroup}
                                        disabled={loading}
                                    >
                                        Create Group
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center space-x-4'>
                    <div className='relative flex-1 max-w-sm'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                        <Input
                            placeholder='Search groups...'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className='pl-10'
                        />
                    </div>
                    <Badge variant='secondary'>
                        {filteredGroups.length} groups
                    </Badge>
                </div>
            </div>

            <div className='flex-1 overflow-auto p-6'>
                <Card>
                    <CardHeader>
                        <CardTitle>Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredGroups.map((group) => (
                                    <TableRow key={group.id}>
                                        <TableCell className='font-medium'>
                                            {group.name}
                                        </TableCell>
                                        <TableCell>
                                            {group.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                group.createdAt,
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center space-x-2'>
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() =>
                                                        openUsersModal(group)
                                                    }
                                                >
                                                    <Users className='h-4 w-4' />
                                                </Button>
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() =>
                                                        openRolesModal(group)
                                                    }
                                                >
                                                    <Shield className='h-4 w-4' />
                                                </Button>
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() =>
                                                        openEditModal(group)
                                                    }
                                                >
                                                    <Edit className='h-4 w-4' />
                                                </Button>
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() =>
                                                        setDeleteGroupId(
                                                            group.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Group Modal */}
            <Dialog
                open={!!editingGroup}
                onOpenChange={() => setEditingGroup(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Group</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div>
                            <Label htmlFor='edit-name'>Group Name</Label>
                            <Input
                                id='edit-name'
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                placeholder='Enter group name'
                            />
                        </div>
                        <div>
                            <Label htmlFor='edit-description'>
                                Description
                            </Label>
                            <Textarea
                                id='edit-description'
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder='Enter group description'
                            />
                        </div>
                        <div className='flex justify-end space-x-2'>
                            <Button
                                variant='outline'
                                onClick={() => setEditingGroup(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateGroup}
                                disabled={loading}
                            >
                                Update Group
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteGroupId}
                onOpenChange={() => setDeleteGroupId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this group? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteGroup}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Group Users Modal */}
            <Dialog open={showUsersModal} onOpenChange={setShowUsersModal}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>
                            Users in {selectedGroup?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                        {groupUsers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                {user.firstName} {user.lastName}
                                            </TableCell>
                                            <TableCell>
                                                {user.emailAddress}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.status === 'ACTIVE'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className='text-center text-muted-foreground py-8'>
                                No users assigned to this group
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Group Roles Modal */}
            <Dialog open={showRolesModal} onOpenChange={setShowRolesModal}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>
                            Roles for {selectedGroup?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                        {groupRoles.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Permissions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupRoles.map((role) => (
                                        <TableRow key={role.id}>
                                            <TableCell className='font-medium'>
                                                {role.name}
                                            </TableCell>
                                            <TableCell>
                                                {role.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className='flex flex-wrap gap-1'>
                                                    {role.permissions.map(
                                                        (permission, index) => (
                                                            <Badge
                                                                key={index}
                                                                variant='outline'
                                                                className='text-xs'
                                                            >
                                                                {permission}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className='text-center text-muted-foreground py-8'>
                                No roles assigned to this group
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
