// Debug utility for API connectivity issues

export const debugAPI = {
    // Test basic connectivity
    testConnectivity: async () => {
        // Ensure the API base doesn't end with /api to avoid double /api/ prefixes
        const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
        const apiBase = rawApiBase.endsWith('/api') ? rawApiBase.slice(0, -4) : rawApiBase;
        
        const results = {
            apiBase: apiBase,
            tests: [] as Array<{name: string; success: boolean; error?: string; response?: any}>
        };

        // Test 1: Basic fetch to API base
        try {
            const response = await fetch(`${results.apiBase}/health`, { method: 'GET' });
            results.tests.push({
                name: 'Basic connectivity to API base',
                success: response.ok,
                response: { status: response.status, statusText: response.statusText }
            });
        } catch (error) {
            results.tests.push({
                name: 'Basic connectivity to API base',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }

        // Test 2: Test business-units endpoint
        try {
            const response = await fetch(`${results.apiBase}/api/business-units`, { method: 'GET' });
            results.tests.push({
                name: 'GET /api/business-units',
                success: response.ok,
                response: { status: response.status, statusText: response.statusText }
            });
        } catch (error) {
            results.tests.push({
                name: 'GET /api/business-units',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }

        // Test 3: Test accounts endpoint
        try {
            const response = await fetch(`${results.apiBase}/api/accounts`, { method: 'GET' });
            results.tests.push({
                name: 'GET /api/accounts',
                success: response.ok,
                response: { status: response.status, statusText: response.statusText }
            });
        } catch (error) {
            results.tests.push({
                name: 'GET /api/accounts',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }

        // Test 4: Test enterprises endpoint
        try {
            const response = await fetch(`${results.apiBase}/api/enterprises`, { method: 'GET' });
            results.tests.push({
                name: 'GET /api/enterprises',
                success: response.ok,
                response: { status: response.status, statusText: response.statusText }
            });
        } catch (error) {
            results.tests.push({
                name: 'GET /api/enterprises',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }

        return results;
    },

    // Log detailed information about failed requests
    logFailedRequest: (endpoint: string, error: any, requestData?: any) => {
        console.group(`🚨 API Request Failed: ${endpoint}`);
        console.error('Error:', error);
        console.error('Error Message:', error instanceof Error ? error.message : String(error));
        console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
        if (requestData) {
            console.error('Request Data:', requestData);
        }
        // Ensure the API base doesn't end with /api to avoid double /api/ prefixes
        const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
        const apiBase = rawApiBase.endsWith('/api') ? rawApiBase.slice(0, -4) : rawApiBase;
        console.error('API Base URL:', apiBase);
        console.error('Timestamp:', new Date().toISOString());
        console.groupEnd();
    },

    // Check if we're in development mode
    isDevelopment: () => {
        return process.env.NODE_ENV === 'development';
    },

    // Get environment info
    getEnvironmentInfo: () => {
        // Ensure the API base doesn't end with /api to avoid double /api/ prefixes
        const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
        const apiBase = rawApiBase.endsWith('/api') ? rawApiBase.slice(0, -4) : rawApiBase;
        
        return {
            nodeEnv: process.env.NODE_ENV,
            apiBase: apiBase,
            isDevelopment: process.env.NODE_ENV === 'development',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side',
            timestamp: new Date().toISOString()
        };
    }
};

// Enhanced error handling for API calls
export const enhancedAPI = {
    get: async <T>(path: string): Promise<T> => {
        try {
            // Ensure the API base doesn't end with /api to avoid double /api/ prefixes
            const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const apiBase = rawApiBase.endsWith('/api') ? rawApiBase.slice(0, -4) : rawApiBase;
            
            const response = await fetch(`${apiBase}${path}`, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details');
                debugAPI.logFailedRequest(`GET ${path}`, new Error(`HTTP ${response.status}: ${errorText}`));
                throw new Error(`API ${response.status}: ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            debugAPI.logFailedRequest(`GET ${path}`, error);
            throw error;
        }
    },

    post: async <T>(path: string, body: unknown): Promise<T> => {
        try {
            // Ensure the API base doesn't end with /api to avoid double /api/ prefixes
            const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const apiBase = rawApiBase.endsWith('/api') ? rawApiBase.slice(0, -4) : rawApiBase;
            
            const response = await fetch(`${apiBase}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details');
                debugAPI.logFailedRequest(`POST ${path}`, new Error(`HTTP ${response.status}: ${errorText}`), body);
                throw new Error(`API ${response.status}: ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            debugAPI.logFailedRequest(`POST ${path}`, error, body);
            throw error;
        }
    }
};
