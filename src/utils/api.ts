// Ensure the API base doesn't end with /api to avoid double /api/ prefixes
const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
export const API_BASE = rawApiBase.endsWith('/api')
    ? rawApiBase.slice(0, -4)
    : rawApiBase;

// Debug log to see what the API base is set to
console.log('Raw API_BASE:', rawApiBase);
console.log('Cleaned API_BASE:', API_BASE);
console.log('NEXT_PUBLIC_API_BASE env var:', process.env.NEXT_PUBLIC_API_BASE);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    // Ensure we don't have double slashes or double /api/ prefixes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${API_BASE}${cleanPath}`;

    console.log('API Request URL:', url); // Debug log

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
