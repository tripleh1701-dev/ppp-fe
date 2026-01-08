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
    hasPasswordHash?: boolean;
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
    accountId?: string | null;
    accountName?: string | null;
    enterpriseId?: string | null;
    enterpriseName?: string | null;
}

export interface ListGroupsOptions {
    search?: string;
    accountId?: string | null;
    accountName?: string | null;
    enterpriseId?: string | null;
    enterpriseName?: string | null;
}

export interface ListRolesOptions {
    groupId?: string;
    accountId?: string | null;
    accountName?: string | null;
    enterpriseId?: string | null;
    enterpriseName?: string | null;
}

// Context interface for CRUD operations with account/enterprise
export interface AccountEnterpriseContext {
    accountId: string;
    accountName: string;
    enterpriseId: string;
    enterpriseName: string;
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

        // Add account parameters even if they exist (including null values)
        // The backend needs to receive them to determine filtering
        if (options.accountId !== undefined) {
            params.append('accountId', options.accountId || '');
        }
        if (options.accountName !== undefined) {
            params.append('accountName', options.accountName || '');
        }
        if (options.enterpriseId !== undefined) {
            params.append('enterpriseId', options.enterpriseId || '');
        }
        if (options.enterpriseName !== undefined) {
            params.append('enterpriseName', options.enterpriseName || '');
        }

        const queryString = params.toString();
        const endpoint = queryString
            ? `/api/users?${queryString}`
            : '/api/users';

        return api.get<UserRecord[]>(endpoint);
    }

    /**
     * Create a new user
     * @param userData User data to create
     * @param context Optional account/enterprise context for scoped storage
     */
    async createUser(
        userData: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<UserRecord> {
        const payload = context ? {...userData, ...context} : userData;
        return api.post<UserRecord>('/api/users', payload);
    }

    /**
     * Update an existing user
     * @param userId User ID to update
     * @param updates Partial user data to update
     * @param context Optional account/enterprise context for scoped storage
     */
    async updateUser(
        userId: string,
        updates: Partial<UserRecord>,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<UserRecord> {
        const payload = context ? {...updates, ...context} : updates;
        return api.put<UserRecord>(`/api/users/${userId}`, payload);
    }

    /**
     * Delete a user
     * @param userId User ID to delete
     * @param context Optional account/enterprise context for scoped storage
     */
    async deleteUser(
        userId: string,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<void> {
        if (context) {
            const params = new URLSearchParams();
            if (context.accountId)
                params.append('accountId', context.accountId);
            if (context.accountName)
                params.append('accountName', context.accountName);
            if (context.enterpriseId)
                params.append('enterpriseId', context.enterpriseId);
            if (context.enterpriseName)
                params.append('enterpriseName', context.enterpriseName);
            const queryString = params.toString();
            return api.del(
                queryString
                    ? `/api/users/${userId}?${queryString}`
                    : `/api/users/${userId}`,
            );
        }
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
        await api.post(`/api/user-management/users/${userId}/groups`, {
            groupId,
        });
    }

    /**
     * Remove user from a group
     */
    async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
        await api.del(
            `/api/user-management/users/${userId}/groups?groupId=${groupId}`,
        );
    }

    // ========================================
    // GROUP OPERATIONS
    // ========================================

    /**
     * List all groups with optional search and account/enterprise filtering
     * Supports both old signature (search?: string) and new signature (options: ListGroupsOptions)
     */
    async listGroups(
        optionsOrSearch?: ListGroupsOptions | string,
    ): Promise<GroupRecord[]> {
        // Handle backward compatibility: if string is passed, treat as search
        const options: ListGroupsOptions =
            typeof optionsOrSearch === 'string'
                ? {search: optionsOrSearch}
                : optionsOrSearch || {};

        const params = new URLSearchParams();
        if (options.search) params.append('search', options.search);
        if (options.accountId !== undefined) {
            params.append('accountId', options.accountId || '');
        }
        if (options.accountName !== undefined) {
            params.append('accountName', options.accountName || '');
        }
        if (options.enterpriseId !== undefined) {
            params.append('enterpriseId', options.enterpriseId || '');
        }
        if (options.enterpriseName !== undefined) {
            params.append('enterpriseName', options.enterpriseName || '');
        }

        const queryString = params.toString();
        const endpoint = queryString
            ? `/api/user-management/groups?${queryString}`
            : '/api/user-management/groups';
        return api.get<GroupRecord[]>(endpoint);
    }

    /**
     * Create a new group
     * @param groupData Group data to create
     * @param context Optional account/enterprise context for scoped storage
     */
    async createGroup(
        groupData: Omit<GroupRecord, 'id' | 'createdAt' | 'updatedAt'>,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<GroupRecord> {
        const payload = context ? {...groupData, ...context} : groupData;
        return api.post<GroupRecord>('/api/user-management/groups', payload);
    }

    /**
     * Update an existing group
     * @param groupId Group ID to update
     * @param updates Partial group data to update
     * @param context Optional account/enterprise context for scoped storage
     */
    async updateGroup(
        groupId: string,
        updates: Partial<GroupRecord>,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<GroupRecord> {
        const payload = context ? {...updates, ...context} : updates;
        return api.put<GroupRecord>(
            `/api/user-management/groups/${groupId}`,
            payload,
        );
    }

    /**
     * Delete a group
     * @param groupId Group ID to delete
     * @param context Optional account/enterprise context for scoped storage
     */
    async deleteGroup(
        groupId: string,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<void> {
        if (context) {
            const params = new URLSearchParams();
            if (context.accountId)
                params.append('accountId', context.accountId);
            if (context.accountName)
                params.append('accountName', context.accountName);
            if (context.enterpriseId)
                params.append('enterpriseId', context.enterpriseId);
            if (context.enterpriseName)
                params.append('enterpriseName', context.enterpriseName);
            const queryString = params.toString();
            return api.del(
                queryString
                    ? `/api/user-management/groups/${groupId}?${queryString}`
                    : `/api/user-management/groups/${groupId}`,
            );
        }
        return api.del(`/api/user-management/groups/${groupId}`);
    }

    /**
     * Get users in a group
     */
    async getGroupUsers(groupId: string): Promise<UserRecord[]> {
        // Note: This endpoint might need to be implemented in user-management controller
        const response = await api.get<UserRecord[]>(
            `/api/user-management/groups/${groupId}/users`,
        );
        return Array.isArray(response) ? response : [];
    }

    /**
     * Get roles assigned to a group
     */
    async getGroupRoles(groupId: string): Promise<RoleRecord[]> {
        const response = await api.get<RoleRecord[]>(
            `/api/user-management/groups/${groupId}/roles`,
        );
        return Array.isArray(response) ? response : [];
    }

    /**
     * Assign role to group
     */
    async assignRoleToGroup(groupId: string, roleId: string): Promise<void> {
        await api.post(`/api/user-management/groups/${groupId}/roles`, {
            roleId,
        });
    }

    /**
     * Remove role from group
     */
    async removeRoleFromGroup(groupId: string, roleId: string): Promise<void> {
        await api.del(`/api/user-management/groups/${groupId}/roles/${roleId}`);
    }

    // ========================================
    // ROLE OPERATIONS
    // ========================================

    /**
     * List all roles with optional group and account/enterprise filtering
     * Supports both old signature (groupId?: string) and new signature (options: ListRolesOptions)
     */
    async listRoles(
        optionsOrGroupId?: ListRolesOptions | string,
    ): Promise<RoleRecord[]> {
        // Handle backward compatibility: if string is passed, treat as groupId
        const options: ListRolesOptions =
            typeof optionsOrGroupId === 'string'
                ? {groupId: optionsOrGroupId}
                : optionsOrGroupId || {};

        const params = new URLSearchParams();
        if (options.groupId) params.append('groupId', options.groupId);
        if (options.accountId !== undefined) {
            params.append('accountId', options.accountId || '');
        }
        if (options.accountName !== undefined) {
            params.append('accountName', options.accountName || '');
        }
        if (options.enterpriseId !== undefined) {
            params.append('enterpriseId', options.enterpriseId || '');
        }
        if (options.enterpriseName !== undefined) {
            params.append('enterpriseName', options.enterpriseName || '');
        }

        const queryString = params.toString();
        const endpoint = queryString
            ? `/api/user-management/roles?${queryString}`
            : '/api/user-management/roles';
        return api.get<RoleRecord[]>(endpoint);
    }

    /**
     * Get role details by ID
     */
    async getRole(roleId: string): Promise<RoleRecord> {
        return api.get<RoleRecord>(`/api/user-management/roles/${roleId}`);
    }

    /**
     * Create a new role
     * @param roleData Role data to create
     * @param context Optional account/enterprise context for scoped storage
     */
    async createRole(
        roleData: Omit<RoleRecord, 'id' | 'createdAt' | 'updatedAt'>,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<RoleRecord> {
        const payload = context ? {...roleData, ...context} : roleData;
        return api.post<RoleRecord>('/api/user-management/roles', payload);
    }

    /**
     * Update an existing role
     * @param roleId Role ID to update
     * @param updates Partial role data to update
     * @param context Optional account/enterprise context for scoped storage
     */
    async updateRole(
        roleId: string,
        updates: Partial<RoleRecord>,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<RoleRecord> {
        const payload = context ? {...updates, ...context} : updates;
        return api.put<RoleRecord>(
            `/api/user-management/roles/${roleId}`,
            payload,
        );
    }

    /**
     * Delete a role
     * @param roleId Role ID to delete
     * @param context Optional account/enterprise context for scoped storage
     */
    async deleteRole(
        roleId: string,
        context?: Partial<AccountEnterpriseContext>,
    ): Promise<void> {
        if (context) {
            const params = new URLSearchParams();
            if (context.accountId)
                params.append('accountId', context.accountId);
            if (context.accountName)
                params.append('accountName', context.accountName);
            if (context.enterpriseId)
                params.append('enterpriseId', context.enterpriseId);
            if (context.enterpriseName)
                params.append('enterpriseName', context.enterpriseName);
            const queryString = params.toString();
            return api.del(
                queryString
                    ? `/api/user-management/roles/${roleId}?${queryString}`
                    : `/api/user-management/roles/${roleId}`,
            );
        }
        return api.del(`/api/user-management/roles/${roleId}`);
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
