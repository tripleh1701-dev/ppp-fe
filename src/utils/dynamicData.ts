import {api} from './api';
import {Entity, Service, Role, UserGroup} from '@/constants/formOptions';

// Cache for dynamic data to avoid repeated API calls
class DynamicDataCache {
    private entities: Entity[] | null = null;
    private services: Service[] | null = null;
    private roles: Role[] | null = null;
    private userGroups: UserGroup[] | null = null;
    private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
    private lastFetch: {[key: string]: number} = {};

    private isExpired(key: string): boolean {
        return (
            !this.lastFetch[key] ||
            Date.now() - this.lastFetch[key] > this.cacheExpiry
        );
    }

    async getEntities(
        accountId?: string,
        enterpriseId?: string,
    ): Promise<Entity[]> {
        const cacheKey = `entities_${accountId}_${enterpriseId}`;
        if (!this.entities || this.isExpired(cacheKey)) {
            try {
                // Use backend API with account and enterprise IDs
                const url =
                    accountId && enterpriseId
                        ? `/api/business-units/entities?accountId=${accountId}&enterpriseId=${enterpriseId}`
                        : '/api/business-units/entities?accountId=4&enterpriseId=7'; // fallback
                this.entities = await api.get<Entity[]>(url);
                this.lastFetch[cacheKey] = Date.now();
            } catch (error) {
                console.warn(
                    'Failed to fetch entities from database, using fallbacks:',
                    error,
                );
                // NO FALLBACK DATA - only show data from database
                console.error('❌ Database connection required for entities');
                this.entities = [];
            }
        }
        return this.entities;
    }

    async getServices(): Promise<Service[]> {
        if (!this.services || this.isExpired('services')) {
            try {
                this.services = await api.get<Service[]>('/api/services');
                this.lastFetch.services = Date.now();
            } catch (error) {
                console.warn(
                    'Failed to fetch services from database, using fallbacks:',
                    error,
                );
                // NO FALLBACK DATA - only show data from database
                console.error('❌ Database connection required for services');
                this.services = [];
            }
        }
        return this.services;
    }

    async getRoles(groupId?: string): Promise<Role[]> {
        const cacheKey = `roles_${groupId || 'all'}`;
        if (!this.roles || this.isExpired(cacheKey)) {
            try {
                // Use backend API with groupId parameter
                const url = groupId
                    ? `/api/roles?groupId=${groupId}`
                    : '/api/roles?groupId=1'; // fallback groupId
                this.roles = await api.get<Role[]>(url);
                this.lastFetch[cacheKey] = Date.now();
            } catch (error) {
                console.warn(
                    'Failed to fetch roles from database, using fallbacks:',
                    error,
                );
                // NO FALLBACK DATA - only show data from database
                console.error('❌ Database connection required for roles');
                this.roles = [];
            }
        }
        return this.roles;
    }

    async getUserGroups(
        accountId?: string,
        enterpriseId?: string,
    ): Promise<UserGroup[]> {
        const cacheKey = `userGroups_${accountId}_${enterpriseId}`;
        if (!this.userGroups || this.isExpired(cacheKey)) {
            try {
                // Use backend API with account and enterprise IDs
                const url =
                    accountId && enterpriseId
                        ? `/api/user-groups?accountId=${accountId}&enterpriseId=${enterpriseId}`
                        : '/api/user-groups?accountId=4&enterpriseId=7'; // fallback
                this.userGroups = await api.get<UserGroup[]>(url);
                this.lastFetch[cacheKey] = Date.now();
            } catch (error) {
                console.warn(
                    'Failed to fetch user groups from database, using fallbacks:',
                    error,
                );
                // NO FALLBACK DATA - only show data from database
                console.error(
                    '❌ Database connection required for user groups',
                );
                this.userGroups = [];
            }
        }
        return this.userGroups;
    }

    // Clear cache methods
    clearEntities() {
        this.entities = null;
        delete this.lastFetch.entities;
    }

    clearServices() {
        this.services = null;
        delete this.lastFetch.services;
    }

    clearRoles() {
        this.roles = null;
        delete this.lastFetch.roles;
    }

    clearUserGroups() {
        this.userGroups = null;
        delete this.lastFetch.userGroups;
    }

    clearAll() {
        this.clearEntities();
        this.clearServices();
        this.clearRoles();
        this.clearUserGroups();
    }
}

// Export singleton instance
export const dynamicDataCache = new DynamicDataCache();

// Convenience functions
export const getEntities = (accountId?: string, enterpriseId?: string) =>
    dynamicDataCache.getEntities(accountId, enterpriseId);
export const getServices = () => dynamicDataCache.getServices();
export const getRoles = (groupId?: string) =>
    dynamicDataCache.getRoles(groupId);
export const getUserGroups = (accountId?: string, enterpriseId?: string) =>
    dynamicDataCache.getUserGroups(accountId, enterpriseId);

// Helper functions for filtering Active items
export const getActiveEntities = async (
    accountId?: string,
    enterpriseId?: string,
) => {
    const entities = await getEntities(accountId, enterpriseId);
    return entities.filter((e) => e.status === 'Active');
};

export const getActiveServices = async () => {
    const services = await getServices();
    return services.filter((s) => s.status === 'Active');
};

export const getActiveRoles = async (groupId?: string) => {
    const roles = await getRoles(groupId);
    return roles.filter((r) => r.status === 'Active');
};

export const getActiveUserGroups = async (
    accountId?: string,
    enterpriseId?: string,
) => {
    const userGroups = await getUserGroups(accountId, enterpriseId);
    return userGroups.filter((ug) => ug.status === 'Active');
};
