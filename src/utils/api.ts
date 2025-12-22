// Declare process.env for TypeScript in browser environment
declare const process: {
    env: {
        NEXT_PUBLIC_API_BASE_URL?: string;
        NEXT_PUBLIC_API_BASE?: string;
        NEXT_PUBLIC_ADMIN_PORTAL_API_URL?: string;
        [key: string]: string | undefined;
    };
};

// API_BASE should be the base URL (e.g., https://xxx.execute-api.../prod)
// All API calls will add /api/v1 prefix
const rawApiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    'http://localhost:3000';
// Remove trailing /api or /api/v1 if present to normalize
let cleanBase = rawApiBase;
if (cleanBase.endsWith('/api/v1')) {
    cleanBase = cleanBase.slice(0, -7);
} else if (cleanBase.endsWith('/api')) {
    cleanBase = cleanBase.slice(0, -4);
}
export const API_BASE = cleanBase;

// External Admin Portal API for fetching accounts from admin-portal infrastructure
export const ADMIN_PORTAL_API_BASE =
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_API_URL ||
    'https://hnm7u7id73.execute-api.us-east-1.amazonaws.com/prod';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    // Ensure we don't have double slashes or double /api/ prefixes
    let cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Add /api/v1 prefix if path starts with /api/ but not /api/v1/
    if (cleanPath.startsWith('/api/') && !cleanPath.startsWith('/api/v1/')) {
        cleanPath = '/api/v1' + cleanPath.slice(4); // Replace /api/ with /api/v1/
    }

    const url = `${API_BASE}${cleanPath}`;

    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
        ...options,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${text}`);
    }
    if (res.status === 204) return undefined as unknown as T;

    // Check if response has content before trying to parse JSON
    const contentType = res.headers.get('content-type');
    const text = await res.text();

    // If response is empty or not JSON, return undefined
    if (!text || !text.trim()) {
        return undefined as unknown as T;
    }

    // If content-type is not JSON, return the text as-is
    if (contentType && !contentType.includes('application/json')) {
        return text as unknown as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch (e) {
        // If JSON parsing fails, return undefined instead of throwing
        console.warn('Failed to parse JSON response, returning undefined:', e);
        return undefined as unknown as T;
    }
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
        request<T>(path, {method: 'POST', body: JSON.stringify(body)}),
    put: <T>(path: string, body: unknown) =>
        request<T>(path, {method: 'PUT', body: JSON.stringify(body)}),
    del: (path: string) => request<void>(path, {method: 'DELETE'}),
};

// Auto-save API functions for manage accounts
export async function saveAccountField(
    accountId: string,
    field: string,
    value: any,
): Promise<any> {
    return request(`/api/accounts/${accountId}/field`, {
        method: 'PATCH',
        body: JSON.stringify({field, value}),
    });
}

export async function saveTechnicalUserField(
    accountId: string,
    userId: string,
    field: string,
    value: any,
): Promise<any> {
    return request(
        `/api/accounts/${accountId}/technical-users/${userId}/field`,
        {
            method: 'PATCH',
            body: JSON.stringify({field, value}),
        },
    );
}

export async function saveLicenseField(
    accountId: string,
    licenseId: string,
    field: string,
    value: any,
): Promise<any> {
    return request(`/api/accounts/${accountId}/licenses/${licenseId}/field`, {
        method: 'PATCH',
        body: JSON.stringify({field, value}),
    });
}

// Enterprise Configuration API functions
export async function fetchEnterprises(): Promise<any[]> {
    return request('/api/enterprises');
}

export async function fetchProducts(): Promise<any[]> {
    return request('/api/products');
}

export async function fetchServices(): Promise<any[]> {
    return request('/api/services');
}

// Enterprise Configuration auto-save API functions
export async function saveEnterpriseConfigurationField(
    recordId: string,
    field: string,
    value: any,
): Promise<any> {
    return request(`/api/enterprise-configuration/${recordId}/field`, {
        method: 'PATCH',
        body: JSON.stringify({field, value}),
    });
}

export async function createEnterpriseConfigurationRecord(data: {
    enterprise: string;
    product: string;
    service: string;
}): Promise<any> {
    return request('/api/enterprise-configuration', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function deleteEnterpriseConfigurationRecord(
    recordId: string,
): Promise<void> {
    return request(`/api/enterprise-configuration/${recordId}`, {
        method: 'DELETE',
    });
}

// Enterprise-Product-Service Linkage API functions
export async function createEnterprise(data: {name: string}): Promise<any> {
    return request('/api/enterprises', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function createProduct(data: {name: string}): Promise<any> {
    return request('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function createService(data: {name: string}): Promise<any> {
    return request('/api/services', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function createEnterpriseProductServiceLinkage(data: {
    enterpriseId: string;
    productId: string;
    serviceIds: string[];
}): Promise<any> {
    return request('/api/enterprise-products-services', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function fetchEnterpriseProductServiceLinkages(): Promise<any[]> {
    return request('/api/enterprise-products-services');
}

export async function fetchLinkagesByEnterprise(
    enterpriseId: string,
): Promise<any[]> {
    return request(
        `/api/enterprise-products-services/enterprise/${enterpriseId}`,
    );
}

export async function fetchDetailedLinkagesByEnterprise(
    enterpriseId: string,
): Promise<any[]> {
    return request(
        `/api/enterprise-products-services/enterprise/${enterpriseId}/detailed`,
    );
}

export async function deleteLinkage(linkageId: string): Promise<void> {
    return request(`/api/enterprise-products-services/${linkageId}`, {
        method: 'DELETE',
    });
}

// Account License API functions
export async function syncLinkageToAccount(data: {
    accountId: string;
    accountName: string;
    linkageId: string;
    licenseStart?: string;
    licenseEnd?: string;
}): Promise<any> {
    return request('/api/account-licenses/sync-linkage', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function syncServiceToAccount(data: {
    accountId: string;
    accountName: string;
    enterpriseId: string;
    productId: string;
    serviceId: string;
    licenseStart?: string;
    licenseEnd?: string;
}): Promise<any> {
    return request('/api/account-licenses/sync', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function fetchAccountLicenses(accountId: string): Promise<any[]> {
    return request(`/api/account-licenses/account/${accountId}`);
}

export async function deleteAccountLicense(
    accountId: string,
    licenseId: string,
): Promise<void> {
    return request(
        `/api/account-licenses/account/${accountId}/license/${licenseId}`,
        {
            method: 'DELETE',
        },
    );
}

export async function updateAccountLicensePeriod(
    accountId: string,
    licenseId: string,
    licenseStart: string,
    licenseEnd: string,
): Promise<any> {
    return request(
        `/api/account-licenses/account/${accountId}/license/${licenseId}`,
        {
            method: 'PUT',
            body: JSON.stringify({licenseStart, licenseEnd}),
        },
    );
}

// ==========================================
// User Management API Functions (systiva table)
// ==========================================

// User operations
export async function fetchUsersFromSystiva(): Promise<any[]> {
    return request('/api/user-management/users');
}

export async function fetchUserFromSystiva(userId: string): Promise<any> {
    return request(`/api/user-management/users/${userId}`);
}

export async function fetchUserWithHierarchy(userId: string): Promise<any> {
    return request(`/api/user-management/users/${userId}/hierarchy`);
}

export async function createUserInSystiva(data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    emailAddress: string;
    status: 'ACTIVE' | 'INACTIVE';
    startDate: string;
    endDate?: string;
    password?: string;
    technicalUser: boolean;
    assignedGroups?: string[];
}): Promise<any> {
    return request('/api/user-management/users', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateUserInSystiva(
    userId: string,
    data: Partial<{
        firstName: string;
        middleName?: string;
        lastName: string;
        emailAddress: string;
        status: 'ACTIVE' | 'INACTIVE';
        startDate: string;
        endDate?: string;
        password?: string;
        technicalUser: boolean;
        assignedGroups?: string[];
    }>,
): Promise<any> {
    return request(`/api/user-management/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteUserFromSystiva(userId: string): Promise<void> {
    return request(`/api/user-management/users/${userId}`, {
        method: 'DELETE',
    });
}

// Group operations
export async function fetchGroupsFromSystiva(): Promise<any[]> {
    return request('/api/user-management/groups');
}

export async function fetchGroupFromSystiva(groupId: string): Promise<any> {
    return request(`/api/user-management/groups/${groupId}`);
}

export async function fetchGroupRoles(groupId: string): Promise<any[]> {
    return request(`/api/user-management/groups/${groupId}/roles`);
}

export async function createGroupInSystiva(data: {
    name: string;
    description?: string;
    assignedRoles?: string[];
}): Promise<any> {
    return request('/api/user-management/groups', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateGroupInSystiva(
    groupId: string,
    data: Partial<{
        name: string;
        description?: string;
        assignedRoles?: string[];
    }>,
): Promise<any> {
    return request(`/api/user-management/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteGroupFromSystiva(groupId: string): Promise<void> {
    return request(`/api/user-management/groups/${groupId}`, {
        method: 'DELETE',
    });
}

// Role operations
export async function fetchRolesFromSystiva(): Promise<any[]> {
    return request('/api/user-management/roles');
}

export async function fetchRoleFromSystiva(roleId: string): Promise<any> {
    return request(`/api/user-management/roles/${roleId}`);
}

export async function createRoleInSystiva(data: {
    name: string;
    description?: string;
    scopeConfig?: any;
}): Promise<any> {
    return request('/api/user-management/roles', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateRoleInSystiva(
    roleId: string,
    data: Partial<{
        name: string;
        description?: string;
        scopeConfig?: any;
    }>,
): Promise<any> {
    return request(`/api/user-management/roles/${roleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteRoleFromSystiva(roleId: string): Promise<void> {
    return request(`/api/user-management/roles/${roleId}`, {
        method: 'DELETE',
    });
}

// ==========================================
// External Admin Portal Account API Functions
// ==========================================

export interface ExternalAccount {
    accountId: string;
    accountName: string;
    subscriptionTier?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    adminEmail?: string;
    adminUsername?: string;
    [key: string]: any; // Allow additional fields
}

export interface MappedAccount {
    id: string;
    accountName: string;
    masterAccount: string;
    cloudType: string;
    address: string;
    country: string;
    addresses: any[];
    licenses: any[];
    technicalUsers: any[];
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Fetch accounts from the external Admin Portal API
 * Maps external API fields to frontend expected format:
 * - accountName from API → accountName (displayed as "Account" on frontend)
 * - accountName from API → masterAccount (same value)
 * - subscriptionTier from API → cloudType
 *
 * Uses Next.js proxy rewrite (/admin-portal-api) to avoid CORS issues,
 * falls back to direct URL if proxy doesn't work.
 */
export async function fetchExternalAccounts(): Promise<MappedAccount[]> {
    // Try proxy URL first (for CORS avoidance), then direct URL as fallback
    const proxyUrl = '/admin-portal-api/api/v1/accounts';
    const directUrl = `${ADMIN_PORTAL_API_BASE}/api/v1/accounts`;

    let url = proxyUrl;
    let usedProxy = true;

    try {
        console.log(
            '🔄 Fetching accounts from external Admin Portal API via proxy:',
            url,
        );

        let res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // If proxy fails, try direct URL
        if (!res.ok && res.status >= 500) {
            console.warn('⚠️ Proxy failed, trying direct URL:', directUrl);
            url = directUrl;
            usedProxy = false;
            res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('❌ External API error:', res.status, text);
            throw new Error(`External API ${res.status}: ${text}`);
        }

        const data = await res.json();
        console.log(
            '📊 External API response (via ' +
                (usedProxy ? 'proxy' : 'direct') +
                '):',
            data,
        );

        // Handle both array and object with accounts property
        const accounts: ExternalAccount[] = Array.isArray(data)
            ? data
            : data.accounts || data.items || [];

        // Map external API fields to frontend expected format
        const mappedAccounts: MappedAccount[] = accounts.map(
            (account: ExternalAccount) => ({
                id: account.accountId || account.id || '',
                accountName: account.accountName || '',
                // masterAccount is same as accountName per user requirement
                masterAccount: account.accountName || '',
                // cloudType maps to subscriptionTier per user requirement
                cloudType: account.subscriptionTier || account.cloudType || '',
                address: account.address || '',
                country: account.country || '',
                addresses: account.addresses || [],
                licenses: account.licenses || [],
                technicalUsers: account.technicalUsers || [],
                createdAt: account.createdAt || account.created_date,
                updatedAt: account.updatedAt || account.updated_date,
            }),
        );

        console.log(
            '✅ Mapped',
            mappedAccounts.length,
            'accounts from external API',
        );
        return mappedAccounts;
    } catch (error) {
        console.error('❌ Error fetching external accounts:', error);
        throw error;
    }
}
