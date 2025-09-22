/**
 * AccessControl API Service - Comprehensive API integration for Role-Based Access Control
 * Handles all CRUD operations for Users, Groups, Roles, and their relationships
 */

import {api} from '../utils/api';

// Type definitions
export interface UserRecord {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    emailAddress: string;
    password?: string;
    status: 'ACTIVE' | 'INACTIVE';
    startDate: string;
    endDate?: string;
    technicalUser: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GroupRecord {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RoleRecord {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ServiceRecord {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ListUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface ListUsersResponse {
    users: UserRecord[];
    total: number;
    page: number;
    limit: number;
}

/**
 * AccessControl API Service Class
 */
export class AccessControlApiService {
    // ========================================
    // USER OPERATIONS
    // ========================================

    /**
     * List users with pagination and filtering
     */
    async listUsers(options: ListUsersOptions = {}): Promise<UserRecord[]> {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.search) params.append('search', options.search);
        if (options.status) params.append('status', options.status);

        const queryString = params.toString();
        const endpoint = queryString
            ? `/api/users?${queryString}`
            : '/api/users';

        return api.get<UserRecord[]>(endpoint);
    }

    /**
     * Create a new user
     */
    async createUser(
        userData: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<UserRecord> {
        return api.post<UserRecord>('/api/users', userData);
    }

    /**
     * Update an existing user
     */
    async updateUser(
        userId: string,
        updates: Partial<UserRecord>,
    ): Promise<UserRecord> {
        return api.put<UserRecord>(`/api/users/${userId}`, updates);
    }

    /**
     * Delete a user
     */
    async deleteUser(userId: string): Promise<void> {
        return api.del(`/api/users/${userId}`);
    }

    /**
     * Get user's assigned groups
     */
    async getUserGroups(userId: string): Promise<GroupRecord[]> {
        const response = await api.get<{
            success: boolean;
            data: {groups: GroupRecord[]};
        }>(`/api/users/${userId}/groups`);
        return response.data.groups;
    }

    /**
     * Assign user to a group
     */
    async assignUserToGroup(userId: string, groupId: string): Promise<void> {
        await api.post(`/api/users/${userId}/groups`, {groupId});
    }

    /**
     * Remove user from a group
     */
    async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
        await api.del(`/api/users/${userId}/groups/${groupId}`);
    }

    // ========================================
    // GROUP OPERATIONS
    // ========================================

    /**
     * List all groups with optional search
     */
    async listGroups(search?: string): Promise<GroupRecord[]> {
        const endpoint = search
            ? `/api/groups?search=${encodeURIComponent(search)}`
            : '/api/groups';
        return api.get<GroupRecord[]>(endpoint);
    }

    /**
     * Create a new group
     */
    async createGroup(
        groupData: Omit<GroupRecord, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<GroupRecord> {
        return api.post<GroupRecord>('/api/groups', groupData);
    }

    /**
     * Update an existing group
     */
    async updateGroup(
        groupId: string,
        updates: Partial<GroupRecord>,
    ): Promise<GroupRecord> {
        return api.put<GroupRecord>(`/api/groups/${groupId}`, updates);
    }

    /**
     * Delete a group
     */
    async deleteGroup(groupId: string): Promise<void> {
        return api.del(`/api/groups/${groupId}`);
    }

    /**
     * Get users in a group
     */
    async getGroupUsers(groupId: string): Promise<UserRecord[]> {
        const response = await api.get<{
            success: boolean;
            data: {users: UserRecord[]};
        }>(`/api/user-groups/${groupId}/users`);
        return response.data.users;
    }

    /**
     * Get roles assigned to a group
     */
    async getGroupRoles(groupId: string): Promise<RoleRecord[]> {
        const response = await api.get<{
            success: boolean;
            data: {roles: RoleRecord[]};
        }>(`/api/user-groups/${groupId}/roles`);
        return response.data.roles;
    }

    /**
     * Assign role to group
     */
    async assignRoleToGroup(groupId: string, roleId: string): Promise<void> {
        await api.post(`/api/user-groups/${groupId}/roles`, {roleId});
    }

    /**
     * Remove role from group
     */
    async removeRoleFromGroup(groupId: string, roleId: string): Promise<void> {
        await api.del(`/api/user-groups/${groupId}/roles/${roleId}`);
    }

    // ========================================
    // ROLE OPERATIONS
    // ========================================

    /**
     * List all roles with optional group filter
     */
    async listRoles(groupId?: string): Promise<RoleRecord[]> {
        const endpoint = groupId
            ? `/api/roles?groupId=${groupId}`
            : '/api/roles';
        return api.get<RoleRecord[]>(endpoint);
    }

    /**
     * Get role details by ID
     */
    async getRole(roleId: string): Promise<RoleRecord> {
        return api.get<RoleRecord>(`/api/roles/${roleId}`);
    }

    /**
     * Create a new role
     */
    async createRole(
        roleData: Omit<RoleRecord, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<RoleRecord> {
        return api.post<RoleRecord>('/api/roles', roleData);
    }

    /**
     * Update an existing role
     */
    async updateRole(
        roleId: string,
        updates: Partial<RoleRecord>,
    ): Promise<RoleRecord> {
        return api.put<RoleRecord>(`/api/roles/${roleId}`, updates);
    }

    /**
     * Delete a role
     */
    async deleteRole(roleId: string): Promise<void> {
        return api.del(`/api/roles/${roleId}`);
    }

    // ========================================
    // SERVICE OPERATIONS (if needed)
    // ========================================

    /**
     * List all services
     */
    async listServices(): Promise<ServiceRecord[]> {
        return api.get<ServiceRecord[]>('/api/services');
    }

    /**
     * Create a new service
     */
    async createService(
        serviceData: Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<ServiceRecord> {
        return api.post<ServiceRecord>('/api/services', serviceData);
    }

    // ========================================
    // BULK OPERATIONS
    // ========================================

    /**
     * Bulk create users
     */
    async bulkCreateUsers(
        users: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>[],
    ): Promise<UserRecord[]> {
        return api.post<UserRecord[]>('/api/users/bulk', {users});
    }

    /**
     * Bulk update users
     */
    async bulkUpdateUsers(
        updates: {id: string; data: Partial<UserRecord>}[],
    ): Promise<UserRecord[]> {
        return api.put<UserRecord[]>('/api/users/bulk', {updates});
    }

    /**
     * Bulk delete users
     */
    async bulkDeleteUsers(userIds: string[]): Promise<void> {
        await fetch(
            `${
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
            }/api/users/bulk`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({userIds}),
            },
        );
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Check if email is available
     */
    async isEmailAvailable(
        email: string,
        excludeUserId?: string,
    ): Promise<boolean> {
        try {
            const users = await this.listUsers({search: email});
            const existingUser = users.find(
                (user) =>
                    user.emailAddress.toLowerCase() === email.toLowerCase() &&
                    user.id !== excludeUserId,
            );
            return !existingUser;
        } catch (error) {
            console.error('Error checking email availability:', error);
            return false;
        }
    }

    /**
     * Search users by various criteria
     */
    async searchUsers(query: string): Promise<UserRecord[]> {
        return this.listUsers({search: query, limit: 100});
    }

    /**
     * Get user's full profile with groups and roles
     */
    async getUserProfile(userId: string): Promise<{
        user: UserRecord;
        groups: GroupRecord[];
        roles: RoleRecord[];
    }> {
        const user = await api.get<UserRecord>(`/api/users/${userId}`);
        const groups = await this.getUserGroups(userId);

        // Get all roles from user's groups
        const rolePromises = groups.map((group) =>
            this.getGroupRoles(group.id),
        );
        const groupRoles = await Promise.all(rolePromises);
        const roles = groupRoles.flat().reduce((unique, role) => {
            if (!unique.find((r) => r.id === role.id)) {
                unique.push(role);
            }
            return unique;
        }, [] as RoleRecord[]);

        return {user, groups, roles};
    }
}

// Export singleton instance
export const accessControlApi = new AccessControlApiService();

// Export default for backward compatibility
export default accessControlApi;
