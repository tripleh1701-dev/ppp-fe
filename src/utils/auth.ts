// Client-side authentication utilities
const AUTH_TOKEN_KEY = 'systiva_auth_token';
const AUTH_REFRESH_TOKEN_KEY = 'systiva_refresh_token';
const AUTH_USER_KEY = 'systiva_user';
const PASSWORD_CHALLENGE_KEY = 'systiva_password_challenge';
// API_BASE_URL should be the base URL without /api/v1 (e.g., https://xxx.execute-api.../prod)
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
// API version prefix for all API calls
const API_VERSION = '/api/v1';

export interface User {
    id: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    name: string;
    role: string;
    roles?: any[]; // Array of role objects from IMS
    userRoles?: any[]; // Alias for roles
    status?: string;
    technicalUser?: boolean;
    tenantId?: string;
    permissions?: string[];
    groups?: any[];
}

export interface LoginResult {
    success: boolean;
    user?: User;
    requiresPasswordChange?: boolean;
    session?: string;
    error?: string;
}

export interface PasswordChallengeData {
    username: string;
    session: string;
}

export const login = async (
    email: string,
    password: string,
): Promise<User | null> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}${API_VERSION}/auth/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email, password, username: email}),
            },
        );

        const result = await response.json();

        // Handle NEW_PASSWORD_REQUIRED challenge
        if (result.requiresPasswordChange) {
            // Store challenge data for password change flow
            if (typeof window !== 'undefined') {
                const challengeData: PasswordChallengeData = {
                    username: email,
                    session: result.session,
                };
                localStorage.setItem(
                    PASSWORD_CHALLENGE_KEY,
                    JSON.stringify(challengeData),
                );
            }
            // Return null but the caller should check for password change requirement
            return null;
        }

        if (response.ok && result.success) {
            // Handle both IMS response format and legacy format
            // IMS format: { success, tokens: { AccessToken, RefreshToken }, user: {...} }
            // Legacy format: { success, data: { token, refreshToken, user: {...} } }
            const userFromResponse = result.user || result.data?.user;
            const tokenFromResponse =
                result.tokens?.AccessToken || result.data?.token;
            const refreshTokenFromResponse =
                result.tokens?.RefreshToken || result.data?.refreshToken;

            if (!userFromResponse) {
                console.error('No user data in response:', result);
                return null;
            }

            // Get roles array from response
            const rolesArray =
                userFromResponse.userRoles || userFromResponse.roles || [];

            const userData: User = {
                id: userFromResponse.id || userFromResponse.username || email,
                email:
                    userFromResponse.emailAddress ||
                    userFromResponse.email ||
                    email,
                firstName: userFromResponse.firstName || '',
                middleName: userFromResponse.middleName || '',
                lastName: userFromResponse.lastName || '',
                name:
                    userFromResponse.firstName && userFromResponse.lastName
                        ? `${userFromResponse.firstName} ${userFromResponse.lastName}`
                        : userFromResponse.username ||
                          userFromResponse.emailAddress ||
                          email,
                role:
                    userFromResponse.role ||
                    rolesArray[0]?.name ||
                    (typeof rolesArray[0] === 'string'
                        ? rolesArray[0]
                        : 'User'),
                roles: rolesArray,
                userRoles: rolesArray,
                status: userFromResponse.status || 'active',
                technicalUser: userFromResponse.technicalUser || false,
                tenantId: userFromResponse.tenantId,
                permissions: userFromResponse.permissions || [],
                groups: userFromResponse.groups || [],
            };

            // Store token and user info
            if (typeof window !== 'undefined') {
                if (tokenFromResponse) {
                    localStorage.setItem(AUTH_TOKEN_KEY, tokenFromResponse);
                }
                if (refreshTokenFromResponse) {
                    localStorage.setItem(
                        AUTH_REFRESH_TOKEN_KEY,
                        refreshTokenFromResponse,
                    );
                }
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
                // Clear any pending password challenge
                localStorage.removeItem(PASSWORD_CHALLENGE_KEY);
            }

            return userData;
        }

        return null;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
};

/**
 * Check if there's a pending password change challenge
 */
export const getPasswordChallengeData = (): PasswordChallengeData | null => {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(PASSWORD_CHALLENGE_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }
    }
    return null;
};

/**
 * Complete the NEW_PASSWORD_REQUIRED challenge
 */
export const completePasswordChallenge = async (
    newPassword: string,
): Promise<User | null> => {
    const challengeData = getPasswordChallengeData();
    if (!challengeData) {
        console.error('No password challenge data found');
        return null;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}${API_VERSION}/auth/complete-password-challenge`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: challengeData.username,
                    email: challengeData.username,
                    newPassword,
                    session: challengeData.session,
                }),
            },
        );

        const result = await response.json();

        if (response.ok && result.success) {
            // Handle both IMS response format and legacy format
            const userFromResponse = result.user || result.data?.user;
            const tokenFromResponse =
                result.tokens?.AccessToken || result.data?.token;
            const refreshTokenFromResponse =
                result.tokens?.RefreshToken || result.data?.refreshToken;

            if (!userFromResponse) {
                console.error('No user data in response:', result);
                return null;
            }

            // Get roles array from response
            const rolesArray =
                userFromResponse.userRoles || userFromResponse.roles || [];

            const userData: User = {
                id:
                    userFromResponse.id ||
                    userFromResponse.username ||
                    challengeData.username,
                email:
                    userFromResponse.emailAddress ||
                    userFromResponse.email ||
                    challengeData.username,
                firstName: userFromResponse.firstName || '',
                middleName: userFromResponse.middleName || '',
                lastName: userFromResponse.lastName || '',
                name:
                    userFromResponse.firstName && userFromResponse.lastName
                        ? `${userFromResponse.firstName} ${userFromResponse.lastName}`
                        : userFromResponse.username || challengeData.username,
                role:
                    userFromResponse.role ||
                    rolesArray[0]?.name ||
                    (typeof rolesArray[0] === 'string'
                        ? rolesArray[0]
                        : 'User'),
                roles: rolesArray,
                userRoles: rolesArray,
                status: userFromResponse.status || 'active',
                technicalUser: userFromResponse.technicalUser || false,
                tenantId: userFromResponse.tenantId,
                permissions: userFromResponse.permissions || [],
                groups: userFromResponse.groups || [],
            };

            // Store token and user info
            if (typeof window !== 'undefined') {
                if (tokenFromResponse) {
                    localStorage.setItem(AUTH_TOKEN_KEY, tokenFromResponse);
                }
                if (refreshTokenFromResponse) {
                    localStorage.setItem(
                        AUTH_REFRESH_TOKEN_KEY,
                        refreshTokenFromResponse,
                    );
                }
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
                // Clear the password challenge
                localStorage.removeItem(PASSWORD_CHALLENGE_KEY);
            }

            return userData;
        }

        return null;
    } catch (error) {
        console.error('Complete password challenge error:', error);
        return null;
    }
};

/**
 * Clear password challenge data
 */
export const clearPasswordChallenge = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(PASSWORD_CHALLENGE_KEY);
    }
};

export const logout = async () => {
    try {
        const token = getAuthToken();
        if (token) {
            await fetch(`${API_BASE_URL}${API_VERSION}/auth/logout`, {
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
            localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(PASSWORD_CHALLENGE_KEY);
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
