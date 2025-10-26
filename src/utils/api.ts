// Ensure the API base doesn't end with /api to avoid double /api/ prefixes
const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
export const API_BASE = rawApiBase.endsWith('/api')
    ? rawApiBase.slice(0, -4)
    : rawApiBase;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    // Ensure we don't have double slashes or double /api/ prefixes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
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
    return (await res.json()) as T;
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
