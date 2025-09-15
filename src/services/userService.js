/**
 * User Service - API integration for user management
 * Handles all CRUD operations for users in the acme.fnd_users table
 */

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

class UserService {
    /**
     * Create a new user
     * @param {Object} userData - User data object
     * @param {string} userData.firstName - User's first name
     * @param {string} userData.middleName - User's middle name (optional)
     * @param {string} userData.lastName - User's last name
     * @param {string} userData.emailAddress - User's email address (unique)
     * @param {string} userData.status - User status ('Active' or 'Inactive')
     * @param {string} userData.startDate - Start date (YYYY-MM-DD)
     * @param {string} userData.endDate - End date (YYYY-MM-DD, optional)
     * @param {string} userData.password - Plain text password (will be hashed on backend)
     * @param {boolean} userData.technicalUser - Whether this is a technical/system user (optional, default: false)
     * @param {number[]} userData.assignedUserGroups - Array of group IDs
     * @returns {Promise<Object>} Created user data
     */
    async createUser(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.getAuthToken()}`,
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create user');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Get all users with pagination and filtering
     * @param {Object} options - Query options (all optional)
     * @param {number} [options.page] - Page number (default: 1)
     * @param {number} [options.limit] - Items per page (default: 50)
     * @param {string} [options.search] - Search term
     * @param {string} [options.status] - Filter by status
     * @param {number} [options.groupId] - Filter by user group
     * @param {string} [options.startDate] - Filter by start date
     * @param {string} [options.endDate] - Filter by end date
     * @returns {Promise<any>} Users data with pagination
     */
    async getUsers(options = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add query parameters if they exist
            Object.keys(options).forEach((key) => {
                if (
                    options[key] !== undefined &&
                    options[key] !== null &&
                    options[key] !== ''
                ) {
                    queryParams.append(key, options[key]);
                }
            });

            const response = await fetch(
                `${API_BASE_URL}/user?${queryParams.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${this.getAuthToken()}`,
                    },
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User data
     */
    async getUserById(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.getAuthToken()}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch user');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    /**
     * Update user
     * @param {number} userId - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} Updated user data
     */
    async updateUser(userId, userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.getAuthToken()}`,
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Update user password
     * @param {number} userId - User ID
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Success message
     */
    async updatePassword(userId, currentPassword, newPassword) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/user/${userId}/password`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.getAuthToken()}`,
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'Failed to update password',
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    /**
     * Delete user
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Success message
     */
    async deleteUser(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${this.getAuthToken()}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Bulk create users
     * @param {Object[]} usersData - Array of user data objects
     * @returns {Promise<Object>} Created users data
     */
    async bulkCreateUsers(usersData) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.getAuthToken()}`,
                },
                body: JSON.stringify({users: usersData}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create users');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating users:', error);
            throw error;
        }
    }

    /**
     * Assign groups to user
     * @param {number} userId - User ID
     * @param {number[]} groupIds - Array of group IDs
     * @returns {Promise<Object>} Success message
     */
    async assignUserGroups(userId, groupIds) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/user/${userId}/groups`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.getAuthToken()}`,
                    },
                    body: JSON.stringify({groupIds}),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to assign groups');
            }

            return await response.json();
        } catch (error) {
            console.error('Error assigning groups:', error);
            throw error;
        }
    }

    /**
     * Remove groups from user
     * @param {number} userId - User ID
     * @param {number[]} groupIds - Array of group IDs to remove
     * @returns {Promise<Object>} Success message
     */
    async removeUserGroups(userId, groupIds) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/user/${userId}/groups`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.getAuthToken()}`,
                    },
                    body: JSON.stringify({groupIds}),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove groups');
            }

            return await response.json();
        } catch (error) {
            console.error('Error removing groups:', error);
            throw error;
        }
    }

    /**
     * Get user's assigned groups
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User groups data
     */
    async getUserGroups(userId) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/user/${userId}/groups`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${this.getAuthToken()}`,
                    },
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'Failed to fetch user groups',
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user groups:', error);
            throw error;
        }
    }

    /**
     * Transform frontend data to backend format
     * @param {Object} frontendData - Data from the table component
     * @returns {Object} Backend-formatted data
     */
    transformToBackendFormat(frontendData) {
        return {
            firstName: frontendData.firstName,
            middleName: frontendData.middleName || null,
            lastName: frontendData.lastName,
            emailAddress: frontendData.emailAddress,
            status: frontendData.status,
            startDate: frontendData.startDate,
            endDate: frontendData.endDate || null,
            password: frontendData.password || 'TempPassword123!',
            technicalUser: frontendData.technicalUser || false,
            // Remove assignedUserGroups to avoid backend table issue
            // assignedUserGroups: frontendData.assignedUserGroup || [],
        };
    }

    /**
     * Transform backend data to frontend format
     * @param {Object} backendData - Data from the API response
     * @returns {Object} Frontend-formatted data
     */
    transformToFrontendFormat(backendData) {
        return {
            id: backendData.id,
            firstName: backendData.firstName,
            middleName: backendData.middleName || '',
            lastName: backendData.lastName,
            emailAddress: backendData.emailAddress,
            status: backendData.status,
            startDate: backendData.startDate,
            endDate: backendData.endDate || '',
            technicalUser: backendData.technicalUser || false,
            assignedUserGroup: backendData.assignedUserGroups || [],
            createdAt: backendData.createdAt,
            updatedAt: backendData.updatedAt,
        };
    }

    /**
     * Get authentication token
     * @returns {string} JWT token
     */
    getAuthToken() {
        // Get token from localStorage, sessionStorage, or context
        return localStorage.getItem('authToken') || '';
    }
}

// Export singleton instance
export default new UserService();
