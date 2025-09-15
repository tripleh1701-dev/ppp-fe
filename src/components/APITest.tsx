'use client';

import { useState } from 'react';
import { api } from '@/utils/api';
import { debugAPI, enhancedAPI } from '@/utils/debugAPI';

export default function APITest() {
    const [testResults, setTestResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const addResult = (result: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
    };

    const testAPI = async () => {
        setIsLoading(true);
        setTestResults([]);
        
        try {
            // Test 1: Check environment info
            const envInfo = debugAPI.getEnvironmentInfo();
            addResult(`Environment: ${envInfo.nodeEnv}`);
            addResult(`API Base URL: ${envInfo.apiBase}`);
            addResult(`User Agent: ${envInfo.userAgent}`);
            
            // Test 2: Enhanced connectivity test
            addResult('Running enhanced connectivity tests...');
            const connectivityResults = await debugAPI.testConnectivity();
            connectivityResults.tests.forEach(test => {
                if (test.success) {
                    addResult(`✅ ${test.name}: ${test.response?.status || 'OK'}`);
                } else {
                    addResult(`❌ ${test.name}: ${test.error}`);
                }
            });
            
            // Test 3: Test POST request to business-units with enhanced error handling
            try {
                addResult('Testing POST /api/business-units with enhanced debugging...');
                const testData = {
                    accountId: 'test-123',
                    accountName: 'Test Account',
                    enterpriseName: 'Test Enterprise',
                    entities: ['Test Entity']
                };
                const response = await enhancedAPI.post('/api/business-units', testData);
                addResult(`✅ POST /api/business-units successful: ${JSON.stringify(response).substring(0, 100)}...`);
            } catch (error) {
                addResult(`❌ POST /api/business-units failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            // Test 4: Test POST request to global-settings with enhanced error handling
            try {
                addResult('Testing POST /api/global-settings with enhanced debugging...');
                const testData = {
                    accountId: 'test-123',
                    accountName: 'Test Account',
                    enterpriseName: 'Test Enterprise',
                    entities: ['Test Entity'],
                    categories: {
                        plan: [],
                        code: [],
                        build: [],
                        test: [],
                        release: [],
                        deploy: [],
                        others: []
                    }
                };
                const response = await enhancedAPI.post('/api/global-settings', testData);
                addResult(`✅ POST /api/global-settings successful: ${JSON.stringify(response).substring(0, 100)}...`);
            } catch (error) {
                addResult(`❌ POST /api/global-settings failed: ${error instanceof Error ? error.message : String(error)}`);
            }

        } catch (error) {
            addResult(`❌ General error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const clearResults = () => {
        setTestResults([]);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">API Connectivity Test</h1>
            
            <div className="mb-4 space-x-2">
                <button
                    onClick={testAPI}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {isLoading ? 'Testing...' : 'Run API Tests'}
                </button>
                <button
                    onClick={clearResults}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Clear Results
                </button>
            </div>

            <div className="bg-gray-100 p-4 rounded">
                <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
                {testResults.length === 0 ? (
                    <p className="text-gray-500">No tests run yet. Click &quot;Run API Tests&quot; to start.</p>
                ) : (
                    <div className="space-y-1">
                        {testResults.map((result, index) => (
                            <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                                {result}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Check if your backend server is running on port 4000</li>
                    <li>• Verify the API endpoints exist and are properly configured</li>
                    <li>• Check browser console for CORS errors</li>
                    <li>• Verify network requests in browser DevTools Network tab</li>
                    <li>• Check if environment variables are properly set</li>
                </ul>
            </div>
        </div>
    );
}
