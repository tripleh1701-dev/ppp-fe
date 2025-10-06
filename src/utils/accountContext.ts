/**
 * Account Context Utility
 * Provides account-aware functionality for all entities in the application
 * Reads from breadcrumb localStorage and appends to API calls
 */

export interface AccountContext {
    accountId: string | null;
    accountName: string | null;
    isSystiva: boolean;
}

/**
 * Get current account context from breadcrumb localStorage
 */
export function getAccountContext(): AccountContext {
    if (typeof window === 'undefined') {
        return {accountId: null, accountName: null, isSystiva: true};
    }

    const accountId = window.localStorage.getItem('selectedAccountId');
    const accountName = window.localStorage.getItem('selectedAccountName');

    const isSystiva =
        !accountId ||
        !accountName ||
        accountId === 'null' ||
        accountName === 'null' ||
        accountName.toLowerCase() === 'systiva';

    return {
        accountId: isSystiva ? null : accountId,
        accountName: isSystiva ? null : accountName,
        isSystiva,
    };
}

/**
 * Add account context to URL search params
 */
export function addAccountToParams(
    params: URLSearchParams,
    context?: AccountContext,
): URLSearchParams {
    const accountContext = context || getAccountContext();

    if (!accountContext.isSystiva) {
        if (accountContext.accountId) {
            params.append('accountId', accountContext.accountId);
        }
        if (accountContext.accountName) {
            params.append('accountName', accountContext.accountName);
        }
    }

    return params;
}

/**
 * Add account context to request body
 */
export function addAccountToBody<T extends Record<string, any>>(
    body: T,
    context?: AccountContext,
): T {
    const accountContext = context || getAccountContext();

    if (!accountContext.isSystiva) {
        return {
            ...body,
            ...(accountContext.accountId && {
                selectedAccountId: accountContext.accountId,
            }),
            ...(accountContext.accountName && {
                selectedAccountName: accountContext.accountName,
            }),
        };
    }

    return body;
}

/**
 * Build account-aware API URL
 */
export function buildAccountAwareUrl(
    baseUrl: string,
    additionalParams?: Record<string, string>,
    context?: AccountContext,
): string {
    const params = new URLSearchParams(additionalParams);
    addAccountToParams(params, context);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Account-aware fetch wrapper
 */
export async function accountAwareFetch<T = any>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const accountContext = getAccountContext();
    const method = options.method || 'GET';

    let finalUrl = url;
    let finalOptions = {...options};

    if (method === 'GET' || method === 'DELETE') {
        // Add account to query params
        const urlObj = new URL(url, window.location.origin);
        addAccountToParams(urlObj.searchParams, accountContext);
        finalUrl = urlObj.toString();
    } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        // Add account to body
        if (options.body) {
            try {
                const bodyObj = JSON.parse(options.body as string);
                const newBody = addAccountToBody(bodyObj, accountContext);
                finalOptions.body = JSON.stringify(newBody);
            } catch {
                // If body is not JSON, leave it as is
            }
        }
    }

    const response = await fetch(finalUrl, finalOptions);

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

/**
 * Get table name based on account context
 * For backend DynamoDB operations
 */
export function getTableName(context?: AccountContext): string {
    const accountContext = context || getAccountContext();
    return accountContext.isSystiva ? 'systiva' : 'sys_accounts';
}

/**
 * Get DynamoDB PK prefix based on account context
 */
export function getPKPrefix(
    entityType: string,
    context?: AccountContext,
): string {
    const accountContext = context || getAccountContext();

    if (accountContext.isSystiva) {
        return 'SYSTIVA';
    }

    return `${accountContext.accountName?.toUpperCase()}#${
        accountContext.accountId
    }#${entityType.toUpperCase()}`;
}

/**
 * Listen for account changes and trigger callback
 */
export function onAccountChange(
    callback: (context: AccountContext) => void,
): () => void {
    const handler = () => {
        callback(getAccountContext());
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handler);
        window.addEventListener('accountChanged', handler);
    }

    // Return cleanup function
    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', handler);
            window.removeEventListener('accountChanged', handler);
        }
    };
}
