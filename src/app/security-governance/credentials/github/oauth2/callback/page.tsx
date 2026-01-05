'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api';

export default function GitHubOAuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Processing OAuth callback...');
    const processedRef = useRef(false);

    useEffect(() => {
        // Prevent duplicate processing in React Strict Mode
        if (processedRef.current) {
            return;
        }
        
        const handleOAuthCallback = async () => {
            // Mark as processed immediately to prevent duplicate calls
            processedRef.current = true;
            try {
                // Parse code and state from URL
                // Next.js should decode automatically, but decode explicitly to be safe
                const code = searchParams.get('code');
                const stateRaw = searchParams.get('state');
                const state = stateRaw ? decodeURIComponent(stateRaw) : null;
                const error = searchParams.get('error');
                const errorDescription = searchParams.get('error_description');
                
                // Extract context parameters from URL (GitHub redirects back with these)
                const urlAccountId = searchParams.get('accountId') || '';
                const urlAccountName = searchParams.get('accountName') || '';
                const urlEnterpriseId = searchParams.get('enterpriseId') || '';
                const urlEnterpriseName = searchParams.get('enterpriseName') || '';
                const urlWorkstream = searchParams.get('workstream') || '';
                const urlProduct = searchParams.get('product') || '';
                const urlService = searchParams.get('service') || '';

                // Handle OAuth error from GitHub
                if (error) {
                    console.error('❌ [OAuth] GitHub OAuth error:', error, errorDescription);
                    setStatus('error');
                    setMessage(errorDescription || error || 'OAuth authorization failed');
                    
                    // Clean up storage
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('latestCSRFToken');
                        sessionStorage.removeItem('githubOAuthConnectorId');
                        localStorage.removeItem('latestCSRFToken');
                        localStorage.removeItem('githubOAuthConnectorId');
                        // Clear cookies
                        document.cookie = 'githubOAuthCSRFToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        document.cookie = 'githubOAuthConnectorId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                    
                    // Redirect back to credentials page after delay
                    setTimeout(() => {
                        router.push('/security-governance/credentials');
                    }, 3000);
                    return;
                }

                // Validate required parameters
                if (!code || !state) {
                    console.error('❌ [OAuth] Missing required OAuth parameters');
                    setStatus('error');
                    setMessage('Invalid OAuth callback. Missing required parameters.');
                    
                    // Clean up storage
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('latestCSRFToken');
                        sessionStorage.removeItem('githubOAuthConnectorId');
                        localStorage.removeItem('latestCSRFToken');
                        localStorage.removeItem('githubOAuthConnectorId');
                        // Clear cookies
                        document.cookie = 'githubOAuthCSRFToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        document.cookie = 'githubOAuthConnectorId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                    
                    setTimeout(() => {
                        router.push('/security-governance/credentials');
                    }, 3000);
                    return;
                }

                // Validate the state parameter (CSRF token)
                // Try multiple storage mechanisms: sessionStorage -> localStorage -> cookie
                // Helper function to get cookie value
                const getCookie = (name: string): string | null => {
                    if (typeof document === 'undefined') return null;
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
                    return null;
                };

                // Try to get token from multiple sources with retry mechanism
                let storedCSRFToken: string | null = null;
                const maxRetries = 5;
                let retryCount = 0;
                
                while (!storedCSRFToken && retryCount < maxRetries) {
                    if (retryCount > 0) {
                        // Wait a bit before retrying (for timing issues)
                        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
                    }
                    
                    storedCSRFToken = 
                        sessionStorage.getItem('latestCSRFToken') ||
                        localStorage.getItem('latestCSRFToken') ||
                        getCookie('githubOAuthCSRFToken');
                    
                    retryCount++;
                }

                console.log('🔍 [OAuth] Validating CSRF token...');
                console.log('🔍 [OAuth] State from URL:', state);
                console.log('🔍 [OAuth] Stored token from sessionStorage:', sessionStorage.getItem('latestCSRFToken'));
                console.log('🔍 [OAuth] Stored token from localStorage:', localStorage.getItem('latestCSRFToken'));
                console.log('🔍 [OAuth] Stored token from cookie:', getCookie('githubOAuthCSRFToken'));
                console.log('🔍 [OAuth] Using token:', storedCSRFToken);
                console.log('🔍 [OAuth] Tokens match?', state === storedCSRFToken);
                console.log('🔍 [OAuth] State length:', state?.length, 'Stored length:', storedCSRFToken?.length);
                console.log('🔍 [OAuth] Retry attempts:', retryCount);

                if (!storedCSRFToken) {
                    console.error('❌ [OAuth] CSRF token not found in sessionStorage or localStorage');
                    setStatus('error');
                    setMessage('Security validation failed: CSRF token not found. Please try again.');
                    
                    // Clean up storage
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('latestCSRFToken');
                        sessionStorage.removeItem('githubOAuthConnectorId');
                        localStorage.removeItem('latestCSRFToken');
                        localStorage.removeItem('githubOAuthConnectorId');
                        // Clear cookies
                        document.cookie = 'githubOAuthCSRFToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        document.cookie = 'githubOAuthConnectorId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                    
                    setTimeout(() => {
                        router.push('/security-governance/credentials');
                    }, 3000);
                    return;
                }

                if (state !== storedCSRFToken) {
                    console.error('❌ [OAuth] CSRF token validation failed');
                    console.error('❌ [OAuth] Expected:', storedCSRFToken);
                    console.error('❌ [OAuth] Received:', state);
                    setStatus('error');
                    setMessage('Security validation failed. Please try again.');
                    
                    // Clean up storage
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('latestCSRFToken');
                        sessionStorage.removeItem('githubOAuthConnectorId');
                        localStorage.removeItem('latestCSRFToken');
                        localStorage.removeItem('githubOAuthConnectorId');
                        // Clear cookies
                        document.cookie = 'githubOAuthCSRFToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        document.cookie = 'githubOAuthConnectorId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                    
                    setTimeout(() => {
                        router.push('/security-governance/credentials');
                    }, 3000);
                    return;
                }

                // CSRF token is valid, proceed with code-token exchange
                console.log('✅ [OAuth] CSRF token validated successfully');
                
                // Remove CSRF token from all storage mechanisms (one-time use)
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('latestCSRFToken');
                    localStorage.removeItem('latestCSRFToken');
                    // Clear cookie
                    document.cookie = 'githubOAuthCSRFToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    document.cookie = 'githubOAuthConnectorId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                }

                // Retrieve credential name, accountId, and enterpriseId from storage
                const credentialNameRaw = 
                    sessionStorage.getItem('githubOAuthCredentialName') || 
                    localStorage.getItem('githubOAuthCredentialName') ||
                    getCookie('githubOAuthCredentialName') ||
                    '';
                const credentialName = credentialNameRaw ? decodeURIComponent(credentialNameRaw) : '';

                // Fallback: Get accountId and enterpriseId from localStorage (set by the app)
                const accountId = urlAccountId || (typeof window !== 'undefined' 
                    ? (window.localStorage.getItem('selectedAccountId') || '')
                    : '');
                const accountName = urlAccountName || (typeof window !== 'undefined'
                    ? (window.localStorage.getItem('selectedAccountName') || '')
                    : '');
                const enterpriseId = urlEnterpriseId || (typeof window !== 'undefined'
                    ? (window.localStorage.getItem('selectedEnterpriseId') || '')
                    : '');
                const enterpriseName = urlEnterpriseName || (typeof window !== 'undefined'
                    ? (window.localStorage.getItem('selectedEnterpriseName') || '')
                    : '');
                const workstream = urlWorkstream || '';
                const product = urlProduct || '';
                const service = urlService || '';

                console.log('🔑 [OAuth] Token exchange context:', {
                    credentialName,
                    credentialNameRaw,
                    accountId,
                    accountName,
                    enterpriseId,
                    enterpriseName,
                    workstream,
                    product,
                    service,
                    hasCode: !!code,
                    fromSessionStorage: !!sessionStorage.getItem('githubOAuthCredentialName'),
                    fromLocalStorage: !!localStorage.getItem('githubOAuthCredentialName'),
                    fromCookie: !!getCookie('githubOAuthCredentialName')
                });
                // Log values explicitly so they're visible even if object is collapsed
                console.log('🔑 [OAuth] Credential Name:', credentialName || 'MISSING');
                console.log('🔑 [OAuth] Account ID:', accountId || 'MISSING');
                console.log('🔑 [OAuth] Account Name:', accountName || 'MISSING');
                console.log('🔑 [OAuth] Enterprise ID:', enterpriseId || 'MISSING');
                console.log('🔑 [OAuth] Enterprise Name:', enterpriseName || 'MISSING');
                console.log('🔑 [OAuth] Workstream:', workstream || 'MISSING');
                console.log('🔑 [OAuth] Product:', product || 'MISSING');
                console.log('🔑 [OAuth] Service:', service || 'MISSING');
                console.log('🔑 [OAuth] Code present:', !!code);

                // Validate that we have the required values
                if (!credentialName) {
                    console.warn('⚠️ [OAuth] WARNING: credentialName is missing! This may cause the token to not be stored correctly.');
                    console.warn('⚠️ [OAuth] Available storage:', {
                        sessionStorage: sessionStorage.getItem('githubOAuthCredentialName'),
                        localStorage: localStorage.getItem('githubOAuthCredentialName'),
                        cookie: getCookie('githubOAuthCredentialName')
                    });
                }
                if (!accountId) {
                    console.warn('⚠️ [OAuth] WARNING: accountId is missing!');
                }
                if (!enterpriseId) {
                    console.warn('⚠️ [OAuth] WARNING: enterpriseId is missing!');
                }

                // Prepare the payload with all context parameters (only include if they have values)
                const tokenExchangePayload: any = { 
                    code,
                };
                
                // Add context parameters only if they exist (no hardcoded values)
                if (credentialName) tokenExchangePayload.credentialName = credentialName;
                if (accountId) tokenExchangePayload.accountId = accountId;
                if (accountName) tokenExchangePayload.accountName = accountName;
                if (enterpriseId) tokenExchangePayload.enterpriseId = enterpriseId;
                if (enterpriseName) tokenExchangePayload.enterpriseName = enterpriseName;
                if (workstream) tokenExchangePayload.workstream = workstream;
                if (product) tokenExchangePayload.product = product;
                if (service) tokenExchangePayload.service = service;

                console.log('📤 [OAuth] Sending token exchange request with payload:', {
                    ...tokenExchangePayload,
                    code: tokenExchangePayload.code ? '[REDACTED]' : undefined
                });
                // Log payload values explicitly
                console.log('📤 [OAuth] Payload - Credential Name:', tokenExchangePayload.credentialName || 'MISSING');
                console.log('📤 [OAuth] Payload - Account ID:', tokenExchangePayload.accountId || 'MISSING');
                console.log('📤 [OAuth] Payload - Account Name:', tokenExchangePayload.accountName || 'MISSING');
                console.log('📤 [OAuth] Payload - Enterprise ID:', tokenExchangePayload.enterpriseId || 'MISSING');
                console.log('📤 [OAuth] Payload - Enterprise Name:', tokenExchangePayload.enterpriseName || 'MISSING');
                console.log('📤 [OAuth] Payload - Workstream:', tokenExchangePayload.workstream || 'MISSING');
                console.log('📤 [OAuth] Payload - Product:', tokenExchangePayload.product || 'MISSING');
                console.log('📤 [OAuth] Payload - Service:', tokenExchangePayload.service || 'MISSING');
                console.log('📤 [OAuth] Payload - Code:', tokenExchangePayload.code ? `[REDACTED - length: ${tokenExchangePayload.code.length}]` : 'MISSING');

                // Send the code to backend for token exchange
                try {
                    const response = await api.post<{ success: boolean; message?: string; accessToken?: string }>(
                        '/api/oauth-token',
                        tokenExchangePayload
                    );

                    if (response && response.success) {
                        console.log('✅ [OAuth] Token exchange successful');
                        setStatus('success');
                        setMessage('OAuth authorization successful! Closing window...');
                        
                        // Store success flag for modal to pick up
                        if (typeof window !== 'undefined') {
                            // Check for both connectorId (from ConnectorModal) and credentialId (from AssignedCredentialModal)
                            const connectorId = 
                                sessionStorage.getItem('githubOAuthConnectorId') || 
                                localStorage.getItem('githubOAuthConnectorId') ||
                                getCookie('githubOAuthConnectorId');
                            const credentialId = 
                                sessionStorage.getItem('githubOAuthCredentialId') || 
                                localStorage.getItem('githubOAuthCredentialId') ||
                                getCookie('githubOAuthCredentialId');
                            
                            const id = connectorId || credentialId;
                            if (id) {
                                localStorage.setItem('githubOAuthSuccess', 'true');
                                localStorage.setItem('githubOAuthShouldReopenModal', 'true');
                                // Store the ID that was used (for compatibility)
                                if (connectorId) {
                                    localStorage.setItem('githubOAuthConnectorId', connectorId);
                                }
                                if (credentialId) {
                                    localStorage.setItem('githubOAuthCredentialId', credentialId);
                                }
                            }
                            
                            // Notify parent window about OAuth success
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'GITHUB_OAUTH_SUCCESS',
                                    connectorId: connectorId || undefined,
                                    credentialId: credentialId || undefined
                                }, window.location.origin);
                                
                                // Also request parent to close this window
                                window.opener.postMessage({
                                    type: 'CLOSE_OAUTH_WINDOW',
                                    connectorId: connectorId || undefined,
                                    credentialId: credentialId || undefined
                                }, window.location.origin);
                            }
                        }
                        
                        // Close this tab/window immediately
                        console.log('🔄 [OAuth] Attempting to close window...');
                        console.log('🔄 [OAuth] window.opener exists?', !!window.opener);
                        console.log('🔄 [OAuth] window.self === window.top?', window.self === window.top);
                        
                        // Try multiple approaches to close the window
                        setTimeout(() => {
                            let windowClosed = false;
                            
                            // Method 1: Try window.close() if we have an opener
                            if (window.opener) {
                                try {
                                    window.close();
                                    // Check if it actually closed
                                    setTimeout(() => {
                                        if (window.closed) {
                                            console.log('✅ [OAuth] Window closed successfully');
                                            windowClosed = true;
                                        } else {
                                            console.log('⚠️ [OAuth] window.close() called but window is still open');
                                        }
                                    }, 100);
                                } catch (e) {
                                    console.error('❌ [OAuth] Error calling window.close():', e);
                                }
                            }
                            
                            // Method 2: If window didn't close, redirect parent and try closing again
                            setTimeout(() => {
                                if (!windowClosed && !window.closed) {
                                    try {
                                        if (window.opener && !window.opener.closed) {
                                            console.log('🔄 [OAuth] Redirecting parent window...');
                                            window.opener.location.href = '/security-governance/credentials';
                                            window.opener.focus();
                                        }
                                        
                                        // Try closing again
                                        setTimeout(() => {
                                            if (!window.closed) {
                                                try {
                                                    window.close();
                                                    console.log('🔄 [OAuth] Retry: window.close() called');
                                                } catch (e) {
                                                    console.error('❌ [OAuth] Retry: Error closing window:', e);
                                                    // Final fallback: redirect current window
                                                    console.log('🔄 [OAuth] Final fallback: Redirecting current window');
                                                    router.push('/security-governance/credentials');
                                                }
                                            }
                                        }, 500);
                                    } catch (e) {
                                        console.error('❌ [OAuth] Error accessing window.opener:', e);
                                        // Can't access opener - redirect current window
                                        router.push('/security-governance/credentials');
                                    }
                                } else if (windowClosed || window.closed) {
                                    console.log('✅ [OAuth] Window is closed');
                                }
                            }, 500);
                        }, 500); // Reduced from 1000ms to 500ms for faster closing
                    } else {
                        throw new Error(response.message || 'Token exchange failed');
                    }
                } catch (apiError: any) {
                    console.error('❌ [OAuth] Token exchange failed:', apiError);
                    setStatus('error');
                    const errorMessage = apiError?.message || 'Failed to exchange authorization code. Please try again.';
                    setMessage(errorMessage);
                    
                    // Store error flag for modal to pick up
                    if (typeof window !== 'undefined') {
                        // Check for both connectorId (from ConnectorModal) and credentialId (from AssignedCredentialModal)
                        const connectorId = 
                            sessionStorage.getItem('githubOAuthConnectorId') || 
                            localStorage.getItem('githubOAuthConnectorId') ||
                            getCookie('githubOAuthConnectorId');
                        const credentialId = 
                            sessionStorage.getItem('githubOAuthCredentialId') || 
                            localStorage.getItem('githubOAuthCredentialId') ||
                            getCookie('githubOAuthCredentialId');
                        
                        const id = connectorId || credentialId;
                        if (id) {
                            localStorage.setItem('githubOAuthSuccess', 'false');
                            localStorage.setItem('githubOAuthError', errorMessage);
                            localStorage.setItem('githubOAuthShouldReopenModal', 'true');
                            // Store the ID that was used (for compatibility)
                            if (connectorId) {
                                localStorage.setItem('githubOAuthConnectorId', connectorId);
                            }
                            if (credentialId) {
                                localStorage.setItem('githubOAuthCredentialId', credentialId);
                            }
                        }
                        
                        // Notify parent window about OAuth error
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'GITHUB_OAUTH_ERROR',
                                connectorId: connectorId || undefined,
                                credentialId: credentialId || undefined,
                                error: errorMessage
                            }, window.location.origin);
                        }
                    }
                    
                    setTimeout(() => {
                        try {
                            if (window.opener && !window.opener.closed) {
                                window.opener.location.href = '/security-governance/credentials';
                                window.opener.focus();
                            }
                            // Try to close this window
                            try {
                                window.close();
                            } catch (e) {
                                console.error('Error closing window:', e);
                            }
                            // Fallback: redirect current window if close fails
                            setTimeout(() => {
                                if (!window.closed) {
                                    router.push('/security-governance/credentials');
                                }
                            }, 1000);
                        } catch (e) {
                            router.push('/security-governance/credentials');
                        }
                    }, 3000);
                }
            } catch (error: any) {
                console.error('❌ [OAuth] Unexpected error:', error);
                setStatus('error');
                setMessage(error?.message || 'An unexpected error occurred. Please try again.');
                
                // Clean up localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('latestCSRFToken');
                    localStorage.removeItem('githubOAuthConnectorId');
                }
                
                setTimeout(() => {
                    router.push('/security-governance/credentials');
                }, 3000);
            }
        };

        handleOAuthCallback();
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                {status === 'processing' && (
                    <div className="space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-700">{message}</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="space-y-4">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-gray-700 font-medium">{message}</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="space-y-4">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-red-600 font-medium">{message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

