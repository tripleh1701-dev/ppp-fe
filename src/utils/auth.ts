// Client-side authentication utilities
const AUTH_TOKEN_KEY = 'systiva_auth_token';
const AUTH_USER_KEY = 'systiva_user';
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface User {
    id: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    name: string;
    role: string;
    status?: string;
    technicalUser?: boolean;
}

export const login = async (
    email: string,
    password: string,
): Promise<User | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({email, password}),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            const userData: User = {
                id: result.data.user.id,
                email: result.data.user.emailAddress,
                firstName: result.data.user.firstName,
                middleName: result.data.user.middleName,
                lastName: result.data.user.lastName,
                name: `${result.data.user.firstName} ${result.data.user.lastName}`,
                role: result.data.user.role || 'User',
                status: result.data.user.status,
                technicalUser: result.data.user.technicalUser,
            };

            // Store token and user info
            if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_TOKEN_KEY, result.data.token);
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
            }

            return userData;
        }

        return null;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
};

export const logout = async () => {
    try {
        const token = getAuthToken();
        if (token) {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
        }
    }
};

export const getCurrentUser = (): User | null => {
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem(AUTH_USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    return getCurrentUser() !== null;
};

export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
};

export const getUserRole = (): string | null => {
    const user = getCurrentUser();
    return user?.role || null;
};

export const getUserName = (): string | null => {
    const user = getCurrentUser();
    return user?.name || null;
};
