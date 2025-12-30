'use client';

import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {
    login,
    isAuthenticated,
    getPasswordChallengeData,
    completePasswordChallenge,
    clearPasswordChallenge,
} from '@/utils/auth';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // If already authenticated, redirect to dashboard
        if (isAuthenticated()) {
            router.push('/dashboard');
        }
        // Check if there's a pending password change
        const challengeData = getPasswordChallengeData();
        if (challengeData) {
            setEmail(challengeData.username);
            setShowPasswordChange(true);
        }
    }, [router]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Perform login
            const user = await login(email, password);

            if (user) {
                // Success - redirect to dashboard
                // Use router.push which respects Next.js basePath configuration
                router.push('/dashboard');
            } else {
                // Check if password change is required
                const challengeData = getPasswordChallengeData();
                if (challengeData) {
                    setShowPasswordChange(true);
                    setError('');
                    setIsLoading(false);
                } else {
                    // Failed - show error
                    setError('Invalid email or password. Please try again.');
                    setIsLoading(false);
                }
            }
        } catch (err) {
            setError('An error occurred during login. Please try again.');
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            const user = await completePasswordChallenge(newPassword);
            if (user) {
                // Use router.push which respects Next.js basePath
                router.push('/dashboard');
            } else {
                setError('Failed to update password. Please try again.');
                setIsLoading(false);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const handleCancelPasswordChange = () => {
        clearPasswordChallenge();
        setShowPasswordChange(false);
        setNewPassword('');
        setConfirmPassword('');
        setPassword('');
    };

    const handleGoogleLogin = () => {
        // Handle Google login
        console.log('Google login');
        setError('Google login not yet implemented');
    };

    const handleGithubLogin = () => {
        // Handle GitHub login
        console.log('GitHub login');
        setError('GitHub login not yet implemented');
    };

    return (
        <div className='flex min-h-screen h-screen w-screen overflow-hidden fixed inset-0'>
            {/* Left Side - Branding */}
            <div
                className='hidden lg:flex relative flex-col justify-between p-12 text-white'
                style={{
                    backgroundColor: '#0a1a2f',
                    backgroundImage: 'url(/images/logos/sidebar.png)',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    width: '35%',
                    maxWidth: '650px',
                }}
            >
                {/* Overlay for better text readability */}
                <div className='absolute inset-0 bg-black/20 pointer-events-none'></div>

                {/* Logo */}
                <div className='relative z-10'>
                    <div className='flex items-center gap-4 mb-8'>
                        <Image
                            src='/images/logos/logo.svg'
                            alt='Systiva Logo'
                            width={56}
                            height={56}
                            className='rounded-xl shadow-lg'
                        />
                        <span className='text-3xl font-bold tracking-tight'>
                            Systiva
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className='relative z-10 space-y-8'>
                    <div>
                        <h1 className='text-5xl font-bold leading-tight mb-4'>
                            AI-Powered CI/CD
                            <br />
                            for Enterprise Integration
                        </h1>
                    </div>

                    <div className='space-y-6'>
                        <p
                            className='text-3xl font-light italic'
                            style={{
                                fontFamily: 'Brush Script MT, cursive',
                                color: '#05E9FE',
                            }}
                        >
                            Intelligent Automation,
                            <br />
                            Effortless Deployment
                        </p>

                        <p className='text-base leading-relaxed text-gray-300 max-w-xl'>
                            Systiva harnesses the power of AI to streamline your
                            CI/CD pipeline for Integration deployments,
                            Extension rollouts, and Cloud Analytics. Accelerate
                            delivery, eliminate errors, and deploy with
                            unprecedented confidence across your entire
                            enterprise landscape.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className='relative z-10'>
                    <p className='text-sm text-gray-400 uppercase tracking-wider leading-relaxed'>
                        Transforming how enterprises deploy integrations and
                        analytics
                        <br />
                        with AI-driven automation and intelligent orchestration
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className='flex-1 bg-white flex items-center justify-center p-8 overflow-y-auto'>
                <div className='w-full max-w-md space-y-8'>
                    {/* Mobile Logo */}
                    <div className='lg:hidden flex items-center gap-4 mb-8'>
                        <Image
                            src='/images/logos/logo.svg'
                            alt='Systiva Logo'
                            width={56}
                            height={56}
                            className='rounded-xl shadow-lg'
                        />
                        <span className='text-3xl font-bold tracking-tight text-slate-900'>
                            Systiva
                        </span>
                    </div>

                    {/* Header */}
                    <div>
                        <h2 className='text-3xl font-bold text-slate-900'>
                            {isSignUp ? 'Sign up' : 'Sign in'}
                        </h2>
                        <p className='mt-2 text-sm text-slate-600'>
                            {isSignUp
                                ? 'Get started for free. No credit card required.'
                                : 'Welcome back! Please sign in to continue.'}
                        </p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className='space-y-3'>
                        <button
                            onClick={handleGoogleLogin}
                            className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0171EC] hover:bg-[#005fca] text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md'
                        >
                            <svg
                                className='w-5 h-5'
                                viewBox='0 0 24 24'
                                fill='currentColor'
                            >
                                <path d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
                                <path d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
                                <path d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
                                <path d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            onClick={handleGithubLogin}
                            className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0171EC] hover:bg-[#005fca] text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md'
                        >
                            <svg
                                className='w-5 h-5'
                                fill='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                            </svg>
                            Continue with GitHub
                        </button>
                    </div>

                    {/* Additional SSO Options */}
                    <div className='flex items-center justify-center gap-4'>
                        <button className='p-2 rounded-lg hover:bg-slate-100 transition-colors'>
                            <svg
                                className='w-6 h-6 text-[#0171EC]'
                                fill='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path d='M19.5 3h-15C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3zM12 6.5c1.38 0 2.5 1.12 2.5 2.5S13.38 11.5 12 11.5 9.5 10.38 9.5 9 10.62 6.5 12 6.5zM17 17H7v-1.25c0-1.66 3.33-2.5 5-2.5s5 .84 5 2.5V17z' />
                            </svg>
                        </button>
                        <button className='p-2 rounded-lg hover:bg-slate-100 transition-colors'>
                            <svg
                                className='w-6 h-6 text-orange-600'
                                fill='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path d='M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm-1.073 18.564L4.366 15.23V8.77l6.561 3.334v6.46zm1.146-.002v-6.458l6.559-3.335v6.459l-6.559 3.334z' />
                            </svg>
                        </button>
                        <button className='p-2 rounded-lg hover:bg-slate-100 transition-colors'>
                            <svg
                                className='w-6 h-6 text-[#0171EC]'
                                fill='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                            </svg>
                        </button>
                        <button className='p-2 rounded-lg hover:bg-slate-100 transition-colors'>
                            <svg
                                className='w-6 h-6 text-[#05E9FE]'
                                fill='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path d='M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z' />
                            </svg>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className='relative'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-slate-300'></div>
                        </div>
                        <div className='relative flex justify-center text-sm'>
                            <span className='px-2 bg-white text-slate-500'>
                                OR
                            </span>
                        </div>
                    </div>

                    {/* Password Change Form (for first-time login) */}
                    {showPasswordChange ? (
                        <form
                            onSubmit={handlePasswordChange}
                            className='space-y-4'
                        >
                            <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4'>
                                <p className='text-sm text-blue-800 font-medium'>
                                    🔐 Password Change Required
                                </p>
                                <p className='text-sm text-blue-600 mt-1'>
                                    This is your first login. Please create a
                                    new password.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor='email-display'
                                    className='block text-sm font-medium text-slate-700 mb-1'
                                >
                                    Email
                                </label>
                                <input
                                    id='email-display'
                                    type='email'
                                    value={email}
                                    disabled
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-500'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='newPassword'
                                    className='block text-sm font-medium text-slate-700 mb-1'
                                >
                                    New Password
                                </label>
                                <input
                                    id='newPassword'
                                    type='password'
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0171EC] focus:border-[#0171EC] transition-colors'
                                    placeholder='Enter new password (min 8 characters)'
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='confirmPassword'
                                    className='block text-sm font-medium text-slate-700 mb-1'
                                >
                                    Confirm Password
                                </label>
                                <input
                                    id='confirmPassword'
                                    type='password'
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0171EC] focus:border-[#0171EC] transition-colors'
                                    placeholder='Confirm new password'
                                    required
                                    minLength={8}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                                    <p className='text-sm text-red-600 flex items-center gap-2'>
                                        <svg
                                            className='w-5 h-5'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                        >
                                            <path
                                                fillRule='evenodd'
                                                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                                                clipRule='evenodd'
                                            />
                                        </svg>
                                        {error}
                                    </p>
                                </div>
                            )}

                            <button
                                type='submit'
                                disabled={isLoading}
                                className='w-full px-4 py-3 bg-[#0171EC] hover:bg-[#005fca] disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md'
                            >
                                {isLoading
                                    ? 'Updating Password...'
                                    : 'Update Password & Sign In'}
                            </button>

                            <button
                                type='button'
                                onClick={handleCancelPasswordChange}
                                className='w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors'
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        /* Email Login Form */
                        <form onSubmit={handleEmailLogin} className='space-y-4'>
                            {isSignUp && (
                                <div>
                                    <label
                                        htmlFor='name'
                                        className='block text-sm font-medium text-slate-700 mb-1'
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        id='name'
                                        type='text'
                                        className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0171EC] focus:border-[#0171EC] transition-colors'
                                        placeholder='Enter your full name'
                                    />
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor='email'
                                    className='block text-sm font-medium text-slate-700 mb-1'
                                >
                                    Email
                                </label>
                                <input
                                    id='email'
                                    type='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0171EC] focus:border-[#0171EC] transition-colors'
                                    placeholder='Enter your email'
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='password'
                                    className='block text-sm font-medium text-slate-700 mb-1'
                                >
                                    Password
                                </label>
                                <input
                                    id='password'
                                    type='password'
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0171EC] focus:border-[#0171EC] transition-colors'
                                    placeholder='Enter your password'
                                    required
                                />
                            </div>

                            {!isSignUp && (
                                <div className='flex items-center justify-between'>
                                    <label className='flex items-center'>
                                        <input
                                            type='checkbox'
                                            className='w-4 h-4 text-[#0171EC] border-slate-300 rounded focus:ring-[#0171EC]'
                                        />
                                        <span className='ml-2 text-sm text-slate-600'>
                                            Remember me
                                        </span>
                                    </label>
                                    <a
                                        href='#'
                                        className='text-sm text-[#0171EC] hover:text-[#005fca] font-medium'
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                                    <p className='text-sm text-red-600 flex items-center gap-2'>
                                        <svg
                                            className='w-5 h-5'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                        >
                                            <path
                                                fillRule='evenodd'
                                                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                                                clipRule='evenodd'
                                            />
                                        </svg>
                                        {error}
                                    </p>
                                </div>
                            )}

                            <button
                                type='submit'
                                disabled={isLoading}
                                className='w-full px-4 py-3 bg-[#0171EC] hover:bg-[#005fca] disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md'
                            >
                                {isLoading
                                    ? 'Signing in...'
                                    : isSignUp
                                    ? 'Sign up with Email'
                                    : 'Sign in'}
                            </button>
                        </form>
                    )}

                    {/* Toggle Sign Up/Sign In */}
                    <div className='text-center text-sm'>
                        <span className='text-slate-600'>
                            {isSignUp
                                ? 'Already have an account?'
                                : "Don't have an account?"}{' '}
                        </span>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className='text-[#0171EC] hover:text-[#005fca] font-medium'
                        >
                            {isSignUp ? 'Sign in' : 'Sign up'}
                        </button>
                    </div>

                    {/* Terms */}
                    <p className='text-xs text-center text-slate-500'>
                        By signing {isSignUp ? 'up' : 'in'}, you agree to our{' '}
                        <a href='#' className='text-[#0171EC] hover:underline'>
                            Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a href='#' className='text-[#0171EC] hover:underline'>
                            Terms of Use
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
