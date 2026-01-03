// Declare process.env for TypeScript in browser environment
declare const process: {
    env: {
        NEXT_PUBLIC_API_BASE_URL?: string;
        NEXT_PUBLIC_API_BASE?: string;
        NEXT_PUBLIC_ADMIN_PORTAL_API_URL?: string;
        [key: string]: string | undefined;
    };
};

// Auth token key - same as in auth.ts
const AUTH_TOKEN_KEY = 'systiva_auth_token';

// Get auth token from localStorage (inline to avoid circular dependency with auth.ts)
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
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
// This should be the same as API_BASE since accounts endpoint is on the same API Gateway
export const ADMIN_PORTAL_API_BASE =
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    // Ensure we don't have double slashes or double /api/ prefixes
    let cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Route sys-app endpoints to ppp-be-main (workflow 10) at /api/v1/app/*
    // These are handled by the simplified Lambda handler
    const sysAppEndpoints = [
        '/api/accounts',
        '/api/enterprises',
        '/api/products',
        '/api/services',
        '/api/enterprise-products-services',
        '/api/users',
        '/api/user-groups',
        '/api/roles',
        '/api/groups',
        '/api/pipeline-canvas',
    ];

    const isSysAppEndpoint = sysAppEndpoints.some(
        (endpoint) =>
            cleanPath === endpoint || cleanPath.startsWith(`${endpoint}/`),
    );

    if (isSysAppEndpoint) {
        // Route to ppp-be-main backend at /api/v1/app/{path}
        cleanPath = '/api/v1/app' + cleanPath;
    } else if (
        cleanPath.startsWith('/api/') &&
        !cleanPath.startsWith('/api/v1/')
    ) {
        // Other endpoints go to admin-portal-be at /api/v1/*
        cleanPath = '/api/v1' + cleanPath.slice(4); // Replace /api/ with /api/v1/
    }

    const url = `${API_BASE}${cleanPath}`;

    // Get auth token for all requests
    const token = getAuthToken();

    // Build headers with auth token
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options?.headers as Record<string, string>) || {}),
    };

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        headers,
        ...options,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');

        // Handle 401 Unauthorized - token expired or missing
        if (res.status === 401) {
            console.error('❌ API 401 Unauthorized:', url);
            console.error('🔐 Token present:', !!token);

            // Clear stored auth data and redirect to login
            if (typeof window !== 'undefined') {
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    console.log('🔒 Token expired, redirecting to login...');
                    localStorage.removeItem('systiva_auth_token');
                    localStorage.removeItem('systiva_refresh_token');
                    localStorage.removeItem('systiva_user');
                    // Use basePath for proper redirect in production
                    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
                    window.location.href = `${basePath}/login`;
                    return undefined as unknown as T;
                }
            }
        }

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
 * Fetch accounts from the Admin Portal API
 * Uses the same API Gateway as other endpoints, with JWT authentication
 *
 * Maps external API fields to frontend expected format:
 * - accountName from API → accountName (displayed as "Account" on frontend)
 * - accountName from API → masterAccount (same value)
 * - subscriptionTier from API → cloudType
 */
export async function fetchExternalAccounts(): Promise<MappedAccount[]> {
    // Use ppp-be-main (workflow 10) backend - independent from admin-portal
    // Endpoint: /api/v1/app/api/accounts (routes to sys-app Lambda)
    let baseUrl = API_BASE;
    if (baseUrl.endsWith('/api/v1')) {
        baseUrl = baseUrl.slice(0, -7);
    } else if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
    }

    // Call ppp-be-main backend at /api/v1/app/api/accounts
    const url = `${baseUrl}/api/v1/app/api/accounts`;

    // Get JWT token for authentication
    const token = getAuthToken();

    // Debug: log configuration
    console.log('🔧 API_BASE:', API_BASE);
    console.log('🔧 Cleaned baseUrl:', baseUrl);
    console.log('🔧 Final URL (ppp-be):', url);
    console.log('🔐 Auth token present:', !!token);

    try {
        console.log('🔄 Fetching accounts from ppp-be backend:', url);

        // Build headers with authentication
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add Authorization header if token is available
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.warn('⚠️ No auth token found. API call may fail with 401.');
        }

        const res = await fetch(url, {
            method: 'GET',
            headers,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('❌ API error:', res.status, text);

            // If 401, the token might be expired or missing
            if (res.status === 401) {
                console.error(
                    '🔐 Authentication failed. Token may be expired or missing.',
                );
                console.error('🔐 Token was:', token ? 'present' : 'missing');
            }

            throw new Error(`API ${res.status}: ${text}`);
        }

        const responseData = await res.json();
        console.log('📊 API response:', responseData);

        // Handle the nested response structure:
        // { msg: "...", data: { accounts: [...] }, result: "success" }
        // Or direct array
        // Or { accounts: [...] }
        let accounts: ExternalAccount[] = [];

        if (Array.isArray(responseData)) {
            // Direct array response
            accounts = responseData;
        } else if (
            responseData.data &&
            Array.isArray(responseData.data.accounts)
        ) {
            // Nested structure: { data: { accounts: [...] } }
            accounts = responseData.data.accounts;
        } else if (Array.isArray(responseData.accounts)) {
            // Simple structure: { accounts: [...] }
            accounts = responseData.accounts;
        } else if (Array.isArray(responseData.items)) {
            // Alternative structure: { items: [...] }
            accounts = responseData.items;
        }

        console.log(
            '📊 Extracted accounts array:',
            accounts.length,
            'accounts',
        );

        // Map subscriptionTier to display value for cloudType
        const mapSubscriptionTierToCloudType = (
            tier: string | undefined,
        ): string => {
            if (!tier) return '';
            const lowerTier = tier.toLowerCase();
            switch (lowerTier) {
                case 'platform':
                    return 'Public Cloud';
                case 'public':
                    return 'Public Cloud';
                case 'private':
                    return 'Private Cloud';
                default:
                    return tier; // Return original if not recognized
            }
        };

        // Map API fields to frontend expected format
        const mappedAccounts: MappedAccount[] = accounts.map(
            (account: ExternalAccount) => {
                const mapped = {
                    id: account.accountId || account.id || '',
                    accountName: account.accountName || '',
                    // masterAccount is same as accountName per user requirement
                    masterAccount: account.accountName || '',
                    // cloudType maps subscriptionTier to display value:
                    // platform/public → "Public Cloud", private → "Private Cloud"
                    cloudType: mapSubscriptionTierToCloudType(
                        account.subscriptionTier || account.cloudType,
                    ),
                    address: account.address || '',
                    country: account.country || '',
                    addresses: account.addresses || [],
                    licenses: account.licenses || [],
                    technicalUsers: account.technicalUsers || [],
                    createdAt:
                        account.createdAt ||
                        account.registeredOn ||
                        account.created_date,
                    updatedAt:
                        account.updatedAt ||
                        account.lastModified ||
                        account.updated_date,
                };
                console.log(
                    '📝 Mapped account:',
                    account.accountName,
                    '→',
                    mapped,
                );
                return mapped;
            },
        );

        console.log('✅ Mapped', mappedAccounts.length, 'accounts from API');
        return mappedAccounts;
    } catch (error) {
        console.error('❌ Error fetching external accounts:', error);
        throw error;
    }
}

// ==========================================
// Account Onboarding API
// ==========================================

export interface AddressDetails {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
}

export interface TechnicalUser {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    adminUsername?: string;
    adminEmail?: string;
    adminPassword?: string;
    assignedUserGroup?: string;
    assignedRole?: string;
    assignmentStartDate?: string;
    assignmentEndDate?: string;
    status?: string;
    createdBy?: string;
}

export interface License {
    id?: string;
    enterprise?: string;
    product?: string;
    service?: string;
    licenseStart?: string;
    licenseEnd?: string;
    users?: number;
    noticePeriod?: number;
    renewalNotice?: boolean;
}

export interface OnboardAccountPayload {
    // Required fields (3)
    accountName: string;
    masterAccount: string;
    subscriptionTier: 'public' | 'private' | 'platform' | string;
    // Optional fields - single values (for backward compatibility)
    email?: string;
    firstName?: string;
    lastName?: string;
    adminUsername?: string;
    adminEmail?: string;
    adminPassword?: string;
    addressDetails?: AddressDetails;
    technicalUser?: TechnicalUser;
    createdBy?: string;
    // Optional fields - arrays (for full data persistence)
    addresses?: AddressDetails[];
    technicalUsers?: TechnicalUser[];
    licenses?: License[];
}

export interface OnboardAccountResponse {
    msg?: string;
    message?: string;
    data?: any;
    result?: string;
    accountId?: string;
    [key: string]: any;
}

/**
 * Onboard a new account via POST to Sys App Backend API (Workflow 10)
 * POST /api/accounts/onboard
 *
 * Required fields: accountName, masterAccount, subscriptionTier
 * Optional fields: addressDetails, technicalUser, email, firstName, lastName, etc.
 *
 * @param payload - Account onboarding details
 * @returns API response with created account details
 */
export async function onboardAccount(
    payload: OnboardAccountPayload,
): Promise<OnboardAccountResponse> {
    // Use ppp-be-main (workflow 10) backend - independent from admin-portal
    // Only 3 required fields: accountName, masterAccount, subscriptionTier
    // Endpoint: /api/v1/app/api/accounts/onboard
    const url = `${API_BASE}/api/v1/app/api/accounts/onboard`;

    // Get authentication token
    const token = getAuthToken();

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn('⚠️ No auth token found. API call may fail with 401.');
    }

    try {
        console.log('🚀 Onboarding account:', payload.accountName);
        console.log('📤 POST to:', url);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error('❌ Onboard API error:', res.status, responseData);

            if (res.status === 401) {
                console.error(
                    '🔐 Authentication failed. Token may be expired or missing.',
                );
            }

            throw new Error(
                `Onboard API ${res.status}: ${
                    responseData.message ||
                    responseData.msg ||
                    JSON.stringify(responseData)
                }`,
            );
        }

        console.log('✅ Account onboarded successfully:', responseData);
        return responseData;
    } catch (error) {
        console.error('❌ Error onboarding account:', error);
        throw error;
    }
}

/**
 * Offboard (delete) account response interface
 */
export interface OffboardAccountResponse {
    result: 'success' | 'failed';
    msg: string;
    data?: {
        accountId: string;
        deletedAt: string;
        infraDeprovisioning?: {
            executionArn?: string;
            note?: string;
        };
    };
}

/**
 * Offboard (delete) an account via ppp-be backend
 * This triggers infrastructure deprovisioning and removes the account from database
 *
 * @param accountId - The ID of the account to offboard
 * @returns API response with deletion details
 */
export async function offboardAccount(
    accountId: string,
): Promise<OffboardAccountResponse> {
    // Use ppp-be-main (workflow 10) backend - independent from admin-portal
    // Endpoint: /api/v1/app/api/accounts/offboard?accountId=xxx
    const url = `${API_BASE}/api/v1/app/api/accounts/offboard?accountId=${accountId}`;

    // Get authentication token
    const token = getAuthToken();

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn('⚠️ No auth token found. API call may fail with 401.');
    }

    try {
        console.log('🗑️ Offboarding account:', accountId);
        console.log('📤 DELETE to:', url);

        const res = await fetch(url, {
            method: 'DELETE',
            headers,
        });

        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error('❌ Offboard API error:', res.status, responseData);

            if (res.status === 401) {
                console.error(
                    '🔐 Authentication failed. Token may be expired or missing.',
                );
            }

            throw new Error(
                `Offboard API ${res.status}: ${
                    responseData.message ||
                    responseData.msg ||
                    JSON.stringify(responseData)
                }`,
            );
        }

        console.log('✅ Account offboarded successfully:', responseData);
        return responseData;
    } catch (error) {
        console.error('❌ Error offboarding account:', error);
        throw error;
    }
}
