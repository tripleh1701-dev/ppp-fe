// Ensure the API base doesn't end with /api to avoid double /api/ prefixes
const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
export const API_BASE = rawApiBase.endsWith('/api') ? rawApiBase.slice(0, -4) : rawApiBase;

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
