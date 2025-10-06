/**
 * Generic Entity Service
 * Account-aware CRUD operations for any entity type
 * Works with pipelines, builds, credentials, connectors, etc.
 */

import {
    getAccountContext,
    addAccountToParams,
    addAccountToBody,
    type AccountContext,
} from '../utils/accountContext';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export class GenericEntityService<T = any> {
    private entityPath: string;

    constructor(entityPath: string) {
        this.entityPath = entityPath;
    }

    /**
     * Get all entities with account context
     */
    async list(additionalParams?: Record<string, string>): Promise<T[]> {
        try {
            const accountContext = getAccountContext();
            const params = new URLSearchParams(additionalParams);
            addAccountToParams(params, accountContext);

            const queryString = params.toString();
            const url = queryString
                ? `${API_BASE_URL}/${this.entityPath}?${queryString}`
                : `${API_BASE_URL}/${this.entityPath}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.entityPath}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${this.entityPath}:`, error);
            throw error;
        }
    }

    /**
     * Get single entity by ID
     */
    async getById(id: string): Promise<T> {
        try {
            const accountContext = getAccountContext();
            const params = new URLSearchParams();
            addAccountToParams(params, accountContext);

            const queryString = params.toString();
            const url = queryString
                ? `${API_BASE_URL}/${this.entityPath}/${id}?${queryString}`
                : `${API_BASE_URL}/${this.entityPath}/${id}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.entityPath} ${id}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${this.entityPath} ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create new entity with account context
     */
    async create(data: Partial<T>): Promise<T> {
        try {
            const accountContext = getAccountContext();
            const requestData = addAccountToBody(
                data as Record<string, any>,
                accountContext,
            );

            const response = await fetch(`${API_BASE_URL}/${this.entityPath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`Failed to create ${this.entityPath}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error creating ${this.entityPath}:`, error);
            throw error;
        }
    }

    /**
     * Update entity with account context
     */
    async update(id: string, data: Partial<T>): Promise<T> {
        try {
            const accountContext = getAccountContext();
            const requestData = addAccountToBody(
                data as Record<string, any>,
                accountContext,
            );

            const response = await fetch(
                `${API_BASE_URL}/${this.entityPath}/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                },
            );

            if (!response.ok) {
                throw new Error(`Failed to update ${this.entityPath} ${id}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error updating ${this.entityPath} ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete entity with account context
     */
    async delete(id: string): Promise<void> {
        try {
            const accountContext = getAccountContext();
            const params = new URLSearchParams();
            addAccountToParams(params, accountContext);

            const queryString = params.toString();
            const url = queryString
                ? `${API_BASE_URL}/${this.entityPath}/${id}?${queryString}`
                : `${API_BASE_URL}/${this.entityPath}/${id}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to delete ${this.entityPath} ${id}`);
            }
        } catch (error) {
            console.error(`Error deleting ${this.entityPath} ${id}:`, error);
            throw error;
        }
    }
}

// Pre-configured services for common entities
export const pipelineService = new GenericEntityService('api/pipelines');
export const buildService = new GenericEntityService('api/builds');
export const credentialService = new GenericEntityService('api/credentials');
export const connectorService = new GenericEntityService('api/connectors');
export const deploymentService = new GenericEntityService('api/deployments');
export const workflowService = new GenericEntityService('api/workflows');
