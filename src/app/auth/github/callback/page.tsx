'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GitHubOAuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Processing OAuth callback...');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const state = searchParams.get('state');

        // Handle OAuth error
        if (error) {
            console.error('❌ [OAuth] GitHub OAuth error:', error, errorDescription);
            setStatus('error');
            setMessage(errorDescription || error || 'OAuth authorization failed');
            
            // Notify parent window about OAuth failure
            if (typeof window !== 'undefined' && window.opener) {
                window.opener.postMessage({
                    type: 'GITHUB_OAUTH_ERROR',
                    error: error,
                    errorDescription: errorDescription || error,
                    state: state
                }, window.location.origin);
            }
            
            // Close window after a delay
            setTimeout(() => {
                if (window.opener) {
                    window.close();
                } else {
                    router.push('/security-governance/credentials');
                }
            }, 3000);
            return;
        }

        // Handle OAuth success
        if (code && state) {
            console.log('✅ [OAuth] GitHub OAuth code received:', code, 'State:', state);
            
            // Exchange code for token (this would typically be done on the backend)
            // For now, we'll send the code to the parent window
            // In production, you should exchange the code for a token on your backend
            
            // Notify parent window about OAuth success
            if (typeof window !== 'undefined' && window.opener) {
                window.opener.postMessage({
                    type: 'GITHUB_OAUTH_SUCCESS',
                    code: code,
                    state: state
                }, window.location.origin);
                
                setStatus('success');
                setMessage('OAuth authorization successful! Closing window...');
                
                // Close window after a short delay
                setTimeout(() => {
                    if (window.opener) {
                        window.close();
                    }
                }, 1500);
            } else {
                // If no opener, redirect to credentials page
                setStatus('success');
                setMessage('OAuth authorization successful! Redirecting...');
                setTimeout(() => {
                    router.push('/security-governance/credentials');
                }, 2000);
            }
        } else {
            // Missing required parameters
            console.error('❌ [OAuth] Missing required OAuth parameters. Code:', !!code, 'State:', !!state);
            setStatus('error');
            setMessage('Invalid OAuth callback. Missing required parameters.');
            
            if (typeof window !== 'undefined' && window.opener) {
                window.opener.postMessage({
                    type: 'GITHUB_OAUTH_ERROR',
                    error: 'invalid_request',
                    errorDescription: 'Missing required OAuth parameters',
                    state: state || null
                }, window.location.origin);
            }
            
            setTimeout(() => {
                if (window.opener) {
                    window.close();
                } else {
                    router.push('/security-governance/credentials');
                }
            }, 3000);
        }
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

