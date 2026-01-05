import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Key, Save, XCircle, ChevronDown, CheckCircle } from 'lucide-react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { generateId } from '@/utils/id-generator';
import { api } from '@/utils/api';
import { Icon } from '@/components/Icons';

export interface Credential {
    id: string;
    credentialId?: string;
    credentialName: string;
    description: string;
    entity: string;
    product: string;
    service: string;
    scope?: string;
    category?: string; // Category from connector
    connector?: string; // Connector name
    isFromDatabase?: boolean;
    // Cloud Foundry (Deploy) service key type
    serviceKeyDetails?: 'API' | 'IFlow';
    // Cloud Foundry OAuth2 fields
    oauth2ClientId?: string;
    oauth2ClientSecret?: string;
    oauth2TokenUrl?: string;
    // Authentication fields
    authenticationType?: string;
    username?: string;
    usernameEncryption?: string;
    apiKey?: string;
    apiKeyEncryption?: string;
    personalAccessToken?: string;
    tokenEncryption?: string;
    githubInstallationId?: string;
    githubInstallationIdEncryption?: string;
    githubApplicationId?: string;
    githubApplicationIdEncryption?: string;
    githubPrivateKey?: string;
}

interface AssignedCredentialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (credentials: Credential[]) => void;
    connectorName: string;
    category?: string; // Category from connector
    connector?: string; // Connector name (same as connectorName, but keeping for clarity)
    initialCredentials?: Credential[];
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    workstream?: string;
    product?: string;
    service?: string;
    serviceKeyDetails?: 'API' | 'IFlow'; // Optional default for Cloud Foundry
    lockServiceKeyDetails?: boolean; // If true, user cannot change Service Key Details (used from EnvironmentModal)
    stackLevel?: number;
}

// Custom Dropdown Component for Encryption Type (Plaintext/Encrypted)
function EncryptionTypeDropdown({
    value,
    onChange,
    disabled,
    isError,
    placeholder = 'Select encryption type...',
}: {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    isError: boolean;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{top: number; left: number; width: number} | null>(null);

    const options = ['Plaintext', 'Encrypted'];

    const calculateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPos({
            top: rect.bottom + 2,
            left: rect.left,
            width: Math.max(150, rect.width),
        });
    }, []);

    useEffect(() => {
        if (open) {
            calculateDropdownPosition();
            const handleReposition = () => calculateDropdownPosition();
            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
            return () => {
                window.removeEventListener('scroll', handleReposition, true);
                window.removeEventListener('resize', handleReposition);
            };
        }
    }, [open, calculateDropdownPosition]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const displayValue = value || placeholder;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`px-2 py-1 pr-6 text-sm font-normal text-black not-italic focus:outline-none bg-transparent border-0 hover:bg-gray-50 rounded flex items-center gap-1 ${
                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                style={{ color: '#000000', fontStyle: 'normal', fontFamily: 'inherit' }}
            >
                <span>{displayValue}</span>
                <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && dropdownPos && !disabled && createPortal(
                <div
                    ref={dropdownRef}
                    className="rounded-xl border border-slate-200 bg-white shadow-2xl"
                    style={{
                        position: 'fixed',
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        maxHeight: '240px',
                        zIndex: 10001, // Higher than modal z-index (10000 for stackLevel=1)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="max-h-60 overflow-auto p-2">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 ${
                                    value === option ? 'bg-blue-100 font-medium' : ''
                                }`}
                                style={{ color: '#000000', fontStyle: 'normal', fontWeight: value === option ? '500' : 'normal' }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// Custom Dropdown Component for Authentication Type
function AuthenticationTypeDropdown({
    value,
    onChange,
    disabled,
    isError,
    placeholder = 'Select authentication type...',
    onValueChange,
    options = [],
}: {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    isError: boolean;
    placeholder?: string;
    onValueChange?: (value: string) => void;
    options?: string[];
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{top: number; left: number; width: number} | null>(null);

    const calculateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPos({
            top: rect.bottom + 2,
            left: rect.left,
            width: Math.max(200, rect.width),
        });
    }, []);

    useEffect(() => {
        if (open) {
            calculateDropdownPosition();
            const handleReposition = () => calculateDropdownPosition();
            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
            return () => {
                window.removeEventListener('scroll', handleReposition, true);
                window.removeEventListener('resize', handleReposition);
            };
        }
    }, [open, calculateDropdownPosition]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const displayValue = value || placeholder;

    const handleOptionClick = (option: string) => {
        onChange(option);
        if (onValueChange) {
            onValueChange(option);
        }
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`w-full text-left px-2 py-1 pr-8 border rounded-lg text-sm font-normal text-black not-italic focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] flex items-center justify-between ${
                    isError
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                        : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                style={{ 
                    color: '#000000', 
                    fontStyle: 'normal',
                    fontFamily: 'inherit'
                }}
            >
                <span>{displayValue}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && dropdownPos && !disabled && createPortal(
                <div
                    ref={dropdownRef}
                    className="rounded-xl border border-slate-200 bg-white shadow-2xl"
                    style={{
                        position: 'fixed',
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        maxHeight: '240px',
                        zIndex: 10001, // Higher than modal z-index (10000 for stackLevel=1)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="max-h-60 overflow-auto p-2">
                        {options.length === 0 ? (
                            <div className="px-3 py-2 text-slate-500 text-center text-sm">No options found</div>
                        ) : (
                            options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleOptionClick(option)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 ${
                                        value === option ? 'bg-blue-100 font-medium' : ''
                                    }`}
                                    style={{ color: '#000000', fontStyle: 'normal', fontWeight: value === option ? '500' : 'normal' }}
                                >
                                    {option}
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// OAuth Button Component - Uses native event listener to bypass popup blockers
function OAuthButton({
    credentialId,
    githubOAuthClientId,
    loadingOAuthClientId,
    credentialName,
    setOauthStatus,
    setOauthMessage,
    disabled,
    oauthWindowsRef,
    selectedAccountId,
    selectedAccountName,
    selectedEnterpriseId,
    selectedEnterprise,
    workstream,
    product,
    service
}: {
    credentialId: string;
    githubOAuthClientId: string | null;
    loadingOAuthClientId: boolean;
    credentialName: string;
    setOauthStatus: React.Dispatch<React.SetStateAction<'idle' | 'pending' | 'success' | 'error'>>;
    setOauthMessage: React.Dispatch<React.SetStateAction<string>>;
    disabled: boolean;
    oauthWindowsRef: React.MutableRefObject<Window | null>;
    selectedAccountId?: string;
    selectedAccountName?: string;
    selectedEnterpriseId?: string;
    selectedEnterprise?: string;
    workstream?: string;
    product?: string;
    service?: string;
}) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const button = buttonRef.current;
        if (!button || disabled) return;

        const handleNativeClick = (e: MouseEvent) => {
            // Validate first - if invalid, prevent default and show error
            if (!githubOAuthClientId || loadingOAuthClientId) {
                e.preventDefault();
                e.stopPropagation();
                setOauthStatus('error');
                setOauthMessage(loadingOAuthClientId 
                    ? 'Loading OAuth configuration...' 
                    : 'GitHub OAuth Client ID is not configured. Please configure it in GitHub OAuth Apps settings.');
                return;
            }

            // Prevent default button behavior
            e.preventDefault();
            e.stopPropagation();

            // CRITICAL: Set status to pending IMMEDIATELY when button is clicked
            setOauthStatus('pending');
            setOauthMessage('OAuth in Progress');

            // Prepare URL data with all context parameters
            const state = crypto.randomUUID().replace(/-/g, '');
            const baseRedirectUri = `${window.location.origin}/security-governance/credentials/github/oauth2/callback`;
            
            // CRITICAL: Build redirect_uri with ALL context parameters as query params
            const redirectParams = new URLSearchParams();
            if (selectedAccountId) redirectParams.set('accountId', selectedAccountId);
            if (selectedAccountName) redirectParams.set('accountName', selectedAccountName);
            if (selectedEnterpriseId) redirectParams.set('enterpriseId', selectedEnterpriseId);
            if (selectedEnterprise) redirectParams.set('enterpriseName', selectedEnterprise);
            if (workstream) redirectParams.set('workstream', workstream);
            if (product) redirectParams.set('product', product);
            if (service) redirectParams.set('service', service);
            
            const redirectUri = redirectParams.toString() 
                ? `${baseRedirectUri}?${redirectParams.toString()}`
                : baseRedirectUri;
            
            // Build OAuth authorization URL
            const queryParams = new URLSearchParams({
                client_id: githubOAuthClientId,
                response_type: 'code',
                scope: 'repo',
                redirect_uri: redirectUri,
                state: state,
            });
            
            const oauthUrl = `https://github.com/login/oauth/authorize?${queryParams.toString()}`;
            
            // CRITICAL: Store OAuth data BEFORE opening window
            localStorage.removeItem('githubOAuthSuccess');
            localStorage.removeItem('githubOAuthError');
            sessionStorage.setItem('latestCSRFToken', state);
            sessionStorage.setItem('githubOAuthCredentialId', credentialId);
            sessionStorage.setItem('githubOAuthCredentialName', credentialName);
            localStorage.setItem('latestCSRFToken', state);
            localStorage.setItem('githubOAuthCredentialId', credentialId);
            localStorage.setItem('githubOAuthCredentialName', credentialName);
            
            const cookieExpiry = new Date(Date.now() + 10 * 60 * 1000).toUTCString();
            document.cookie = `githubOAuthCSRFToken=${state}; expires=${cookieExpiry}; path=/; SameSite=Lax`;
            document.cookie = `githubOAuthCredentialId=${credentialId}; expires=${cookieExpiry}; path=/; SameSite=Lax`;
            document.cookie = `githubOAuthCredentialName=${encodeURIComponent(credentialName)}; expires=${cookieExpiry}; path=/; SameSite=Lax`;
            
            console.log('🔑 [OAuth] Stored credential ID:', credentialId);
            console.log('🔑 [OAuth] Stored credential name:', credentialName);
            console.log('🔑 [OAuth] Context parameters (in redirect_uri):', {
                accountId: selectedAccountId || '(empty)',
                accountName: selectedAccountName || '(empty)',
                enterpriseId: selectedEnterpriseId || '(empty)',
                enterpriseName: selectedEnterprise || '(empty)',
                workstream: workstream || '(empty)',
                product: product || '(empty)',
                service: service || '(empty)',
            });
            console.log('🔑 [OAuth] Redirect URI (with context params):', redirectUri);
            console.log('🔑 [OAuth] Full OAuth Authorization URL:', oauthUrl);
            
            // Open OAuth window
            const oauthWindow = window.open(oauthUrl, '_blank', 'width=600,height=700,noreferrer');
            
            if (oauthWindow) {
                console.log('✅ [OAuth] Window opened successfully');
                oauthWindowsRef.current = oauthWindow;
            } else {
                console.warn('⚠️ [OAuth] window.open() returned null - popup may have been blocked');
            }
            
            // Monitor OAuth completion
            const checkOAuthStatus = () => {
                const storedCredentialId = localStorage.getItem('githubOAuthCredentialId');
                const oauthSuccess = localStorage.getItem('githubOAuthSuccess');
                const oauthError = localStorage.getItem('githubOAuthError');
                
                if (storedCredentialId !== credentialId) {
                    return false;
                }
                
                if (oauthSuccess === 'true') {
                    console.log('✅ [OAuth] Success detected for credential:', credentialId);
                    setOauthStatus('success');
                    setOauthMessage('OAuth configured successfully');
                    
                    localStorage.removeItem('githubOAuthSuccess');
                    if (oauthWindowsRef.current && !oauthWindowsRef.current.closed) {
                        try {
                            oauthWindowsRef.current.close();
                            oauthWindowsRef.current = null;
                        } catch (e) {
                            console.error('❌ [OAuth] Error closing window:', e);
                        }
                    }
                    return true;
                } else if (oauthSuccess === 'false' || oauthError) {
                    console.log('❌ [OAuth] Error detected for credential:', credentialId);
                    setOauthStatus('error');
                    setOauthMessage(oauthError || 'OAuth authorization failed');
                    
                    localStorage.removeItem('githubOAuthError');
                    localStorage.removeItem('githubOAuthSuccess');
                    if (oauthWindowsRef.current && !oauthWindowsRef.current.closed) {
                        try {
                            oauthWindowsRef.current.close();
                            oauthWindowsRef.current = null;
                        } catch (e) {
                            console.error('❌ [OAuth] Error closing window:', e);
                        }
                    }
                    return true;
                }
                return false;
            };
            
            if (checkOAuthStatus()) {
                return;
            }
            
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'githubOAuthSuccess' || e.key === 'githubOAuthError') {
                    if (checkOAuthStatus()) {
                        window.removeEventListener('storage', handleStorageChange);
                    }
                }
            };
            window.addEventListener('storage', handleStorageChange);
            
            const checkInterval = setInterval(() => {
                if (checkOAuthStatus()) {
                    clearInterval(checkInterval);
                    window.removeEventListener('storage', handleStorageChange);
                    return;
                }
                
                if (oauthWindow) {
                    try {
                        if (oauthWindow.closed) {
                            oauthWindowsRef.current = null;
                            console.log('🔄 [OAuth] OAuth window closed, but continuing to monitor...');
                        }
                    } catch (e) {
                        // Cross-origin error - continue monitoring
                    }
                }
            }, 300);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                window.removeEventListener('storage', handleStorageChange);
            }, 600000);
        };

        button.addEventListener('mousedown', handleNativeClick, true);
        
        return () => {
            button.removeEventListener('mousedown', handleNativeClick, true);
        };
    }, [credentialId, githubOAuthClientId, loadingOAuthClientId, credentialName, setOauthStatus, setOauthMessage, disabled, selectedAccountId, selectedAccountName, selectedEnterpriseId, selectedEnterprise, workstream, product, service]);

    return (
        <button
            ref={buttonRef}
            type="button"
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm hover:shadow-md ${
                disabled
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
            <Icon name="github" size={16} className="text-white" />
            <span>
                {loadingOAuthClientId 
                    ? 'Loading...' 
                    : 'Link to GitHub'}
            </span>
        </button>
    );
}

const AssignedCredentialModal: React.FC<AssignedCredentialModalProps> = ({
    isOpen,
    onClose,
    onSave,
    connectorName,
    category = '',
    connector = '',
    initialCredentials = [],
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
    workstream = '',
    product = '',
    service = '',
    serviceKeyDetails,
    lockServiceKeyDetails = false,
    stackLevel = 0
}) => {
    // Calculate modal width based on stack level to keep parent modal's left panel visible
    const PANEL_BASE_WIDTH = 500;
    const SIDE_PANEL_WIDTH = 40;
    const MIN_PANEL_WIDTH = 400;
    const normalizedStackLevel = Math.max(0, stackLevel);
    const panelOffset = Math.min(normalizedStackLevel * SIDE_PANEL_WIDTH, PANEL_BASE_WIDTH - MIN_PANEL_WIDTH);
    const modalWidth = PANEL_BASE_WIDTH - panelOffset;
    const overlayZIndex = 9999 + normalizedStackLevel;
    const isTopLevelModal = normalizedStackLevel === 0;
    const [credential, setCredential] = useState<Credential>({
        id: generateId(),
        credentialName: '',
        description: '',
        entity: workstream || '',
        product: product || '',
        service: service || '',
        category: category || '',
        connector: connector || connectorName || '',
        scope: connector || connectorName || '', // Scope is the connector name
        serviceKeyDetails: serviceKeyDetails,
        authenticationType: '',
        oauth2ClientId: '',
        oauth2ClientSecret: '',
        oauth2TokenUrl: '',
        username: '',
        usernameEncryption: 'Plaintext',
        apiKey: '',
        apiKeyEncryption: 'Encrypted',
        personalAccessToken: '',
        tokenEncryption: 'Plaintext',
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [originalCredential, setOriginalCredential] = useState<Credential | null>(null);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});
    const [validationMessages, setValidationMessages] = useState<{[key: string]: string}>({});
    const prevIsOpenRef = useRef(false);
    
    // OAuth state tracking
    const [oauthStatus, setOauthStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [oauthMessage, setOauthMessage] = useState<string>('');
    const [githubOAuthClientId, setGithubOAuthClientId] = useState<string | null>(null);
    const [loadingOAuthClientId, setLoadingOAuthClientId] = useState(false);
    const oauthWindowsRef = useRef<Window | null>(null);

    // Define authentication types available for each connector
    const AUTH_TYPES_BY_CONNECTOR: Record<string, string[]> = {
        'Jira': ['Username and API Key', 'Personal Access Token'],
        'GitHub': ['Username and Token', 'GitHub App', 'OAuth'],
        'Cloud Foundry': ['OAuth2'],
        // Add more connectors as needed
    };

    // Helper function to get authentication types for a connector
    const getAuthTypesForConnector = useCallback((connectorName: string): string[] => {
        if (!connectorName) return [];
        return AUTH_TYPES_BY_CONNECTOR[connectorName] || [];
    }, []);

    // Load credential when modal opens
    useEffect(() => {
        const isModalOpening = isOpen && !prevIsOpenRef.current;
        
        if (isOpen) {
            if (isModalOpening) {
                if (initialCredentials.length > 0) {
                    const firstCredential = initialCredentials[0];
                    setCredential({
                        ...firstCredential,
                        category: firstCredential.category || category || '',
                        connector: firstCredential.connector || connector || connectorName || '',
                        scope: firstCredential.scope || firstCredential.connector || connector || connectorName || '',
                        authenticationType: firstCredential.authenticationType || '',
                        username: firstCredential.username || '',
                        usernameEncryption: firstCredential.usernameEncryption || 'Plaintext',
                        apiKey: firstCredential.apiKey || '',
                        apiKeyEncryption: firstCredential.apiKeyEncryption || 'Encrypted',
                        personalAccessToken: firstCredential.personalAccessToken || '',
                        tokenEncryption: firstCredential.tokenEncryption || 'Plaintext',
                        githubInstallationId: firstCredential.githubInstallationId || '',
                        githubInstallationIdEncryption: firstCredential.githubInstallationIdEncryption || 'Plaintext',
                        githubApplicationId: firstCredential.githubApplicationId || '',
                        githubApplicationIdEncryption: firstCredential.githubApplicationIdEncryption || 'Plaintext',
                        githubPrivateKey: firstCredential.githubPrivateKey || '',
                    });
                    setOriginalCredential(JSON.parse(JSON.stringify(firstCredential)));
                } else {
                    const newCredential: Credential = {
                        id: generateId(),
                        credentialName: '',
                        description: '',
                        entity: workstream || '',
                        product: product || '',
                        service: service || '',
                        category: category || '',
                        connector: connector || connectorName || '',
                        scope: connector || connectorName || '', // Scope is the connector name
                        authenticationType: '',
                        username: '',
                        usernameEncryption: 'Plaintext',
                        apiKey: '',
                        apiKeyEncryption: 'Encrypted',
                        personalAccessToken: '',
                        tokenEncryption: 'Plaintext',
                    };
                    setCredential(newCredential);
                    setOriginalCredential(null);
                }
                setHasUnsavedChanges(false);
                setValidationErrors({});
                setValidationMessages({});
            }

            // If caller provided a default service key detail (e.g., EnvironmentModal API/IFlow),
            // ensure it is applied every time the modal is open.
            if (serviceKeyDetails) {
                setCredential(prev => ({
                    ...prev,
                    serviceKeyDetails: serviceKeyDetails,
                }));
            }
        }
        
        prevIsOpenRef.current = isOpen;
    }, [isOpen, initialCredentials, workstream, product, service, serviceKeyDetails]);

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen && originalCredential) {
            const hasChanges = JSON.stringify(credential) !== JSON.stringify(originalCredential);
            setHasUnsavedChanges(hasChanges);
        } else if (isOpen && !originalCredential) {
            const hasAnyData = !!(
                credential.credentialName?.trim() ||
                credential.description?.trim() ||
                credential.authenticationType?.trim()
            );
            setHasUnsavedChanges(hasAnyData);
        }
    }, [credential, originalCredential, isOpen]);

    // Load GitHub OAuth Client ID from API
    useEffect(() => {
        if (!isOpen) return;
        
        // Only load if connector is GitHub and OAuth is selected or available
        const isGitHub = (connector || connectorName || '').toLowerCase() === 'github';
        if (!isGitHub) return;
        
        const loadGitHubOAuthClientId = async () => {
            setLoadingOAuthClientId(true);
            try {
                const accountId = selectedAccountId || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountId') : null);
                const accountName = selectedAccountName || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountName') : null);
                const enterpriseId = selectedEnterpriseId || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseId') : null);
                const enterpriseName = selectedEnterprise || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseName') : null);
                
                let apiUrl = '/api/oauth/github/client-id';
                const params = new URLSearchParams();
                if (accountId) params.append('accountId', accountId);
                if (accountName) params.append('accountName', accountName);
                if (enterpriseId) params.append('enterpriseId', enterpriseId);
                if (enterpriseName) params.append('enterpriseName', enterpriseName);
                if (workstream) params.append('workstream', workstream);
                if (product) params.append('product', product);
                if (service) params.append('service', service);
                if (params.toString()) apiUrl += `?${params.toString()}`;
                
                console.log('🔑 [OAuth] Fetching GitHub OAuth Client ID from:', apiUrl);
                
                try {
                    const response = await api.get<{ clientId: string } | { error: string } | any>(apiUrl);
                    
                    if (response && typeof response === 'object') {
                        if ('clientId' in response && response.clientId) {
                            setGithubOAuthClientId(response.clientId);
                            return;
                        }
                        if ('client_id' in response && response.client_id) {
                            setGithubOAuthClientId(response.client_id);
                            return;
                        }
                        if (typeof response === 'string' && response.trim() !== '') {
                            setGithubOAuthClientId(response);
                            return;
                        }
                    }
                    
                    setGithubOAuthClientId(null);
                } catch (apiError: any) {
                    console.error('❌ [OAuth] Failed to load GitHub OAuth Client ID:', apiError);
                    setGithubOAuthClientId(null);
                }
            } catch (error: any) {
                console.error('❌ [OAuth] Unexpected error loading GitHub OAuth Client ID:', error);
                setGithubOAuthClientId(null);
            } finally {
                setLoadingOAuthClientId(false);
            }
        };
        
        loadGitHubOAuthClientId();
    }, [isOpen, connector, connectorName, selectedAccountId, selectedAccountName, selectedEnterpriseId, selectedEnterprise, workstream, product, service]);

    // Listen for OAuth completion
    useEffect(() => {
        if (!isOpen) return;
        
        const handleOAuthMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data.type === 'GITHUB_OAUTH_SUCCESS') {
                const credentialId = event.data.credentialId;
                if (credentialId === credential.id) {
                    console.log('✅ [OAuth] GitHub OAuth successful for credential:', credentialId);
                    setOauthStatus('success');
                    setOauthMessage('OAuth configured successfully');
                    
                    if (oauthWindowsRef.current && !oauthWindowsRef.current.closed) {
                        try {
                            oauthWindowsRef.current.close();
                            oauthWindowsRef.current = null;
                        } catch (e) {
                            console.error('❌ [OAuth] Error closing window:', e);
                        }
                    }
                }
            } else if (event.data.type === 'GITHUB_OAUTH_ERROR') {
                const credentialId = event.data.credentialId;
                const errorMessage = event.data.error || 'OAuth authorization failed';
                if (credentialId === credential.id) {
                    console.error('❌ [OAuth] GitHub OAuth failed for credential:', credentialId, errorMessage);
                    setOauthStatus('error');
                    setOauthMessage(errorMessage);
                    
                    if (oauthWindowsRef.current && !oauthWindowsRef.current.closed) {
                        try {
                            oauthWindowsRef.current.close();
                            oauthWindowsRef.current = null;
                        } catch (e) {
                            console.error('❌ [OAuth] Error closing window:', e);
                        }
                    }
                }
            }
        };

        // Check localStorage for OAuth completion status
        if (typeof window !== 'undefined') {
            const storedCredentialId = localStorage.getItem('githubOAuthCredentialId');
            const oauthSuccess = localStorage.getItem('githubOAuthSuccess');
            
            if (storedCredentialId === credential.id) {
                if (oauthSuccess === 'true') {
                    setOauthStatus('success');
                    setOauthMessage('OAuth configured successfully');
                    localStorage.removeItem('githubOAuthSuccess');
                    localStorage.removeItem('githubOAuthCredentialId');
                } else if (oauthSuccess === 'false') {
                    const errorMessage = localStorage.getItem('githubOAuthError') || 'OAuth authentication failed';
                    setOauthStatus('error');
                    setOauthMessage(errorMessage);
                    localStorage.removeItem('githubOAuthError');
                    localStorage.removeItem('githubOAuthSuccess');
                    localStorage.removeItem('githubOAuthCredentialId');
                } else {
                    // Still pending
                    setOauthStatus('pending');
                    setOauthMessage('OAuth in Progress');
                }
            }
        }

        window.addEventListener('message', handleOAuthMessage);
        return () => {
            window.removeEventListener('message', handleOAuthMessage);
        };
    }, [isOpen, credential.id]);

    const updateCredential = (field: keyof Credential, value: string) => {
        setCredential(prev => ({ ...prev, [field]: value }));
        // Clear validation error when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
            setValidationMessages(prev => {
                const newMessages = { ...prev };
                delete newMessages[field];
                return newMessages;
            });
        }
    };

    const validateCredential = (): boolean => {
        const errors: {[key: string]: boolean} = {};
        const messages: {[key: string]: string} = {};

        // Validate Credential Name - required
        if (!credential.credentialName || !credential.credentialName.trim()) {
            errors.credentialName = true;
            messages.credentialName = 'Credential Name is required';
        }

        // Validate Description - optional, but if provided should be valid
        if (credential.description && credential.description.trim().length > 500) {
            errors.description = true;
            messages.description = 'Description must not exceed 500 characters';
        }

        // Validate authentication fields based on authentication type
        if (credential.authenticationType === 'Username and API Key') {
            if (!credential.username || !credential.username.trim()) {
                errors.username = true;
                messages.username = 'Username is required';
            }
            if (!credential.apiKey || !credential.apiKey.trim()) {
                errors.apiKey = true;
                messages.apiKey = 'API Key is required';
            }
        } else if (credential.authenticationType === 'Username and Token') {
            if (!credential.username || !credential.username.trim()) {
                errors.username = true;
                messages.username = 'Username is required';
            }
            if (!credential.personalAccessToken || !credential.personalAccessToken.trim()) {
                errors.personalAccessToken = true;
                messages.personalAccessToken = 'Personal Access Token is required';
            }
        } else if (credential.authenticationType === 'Personal Access Token') {
            if (!credential.personalAccessToken || !credential.personalAccessToken.trim()) {
                errors.personalAccessToken = true;
                messages.personalAccessToken = 'Personal Access Token is required';
            }
        } else if (credential.authenticationType === 'GitHub App') {
            if (!credential.githubInstallationId || !credential.githubInstallationId.trim()) {
                errors.githubInstallationId = true;
                messages.githubInstallationId = 'GitHub Installation Id is required';
            }
            if (!credential.githubApplicationId || !credential.githubApplicationId.trim()) {
                errors.githubApplicationId = true;
                messages.githubApplicationId = 'GitHub Application Id is required';
            }
            if (!credential.githubPrivateKey || !credential.githubPrivateKey.trim()) {
                errors.githubPrivateKey = true;
                messages.githubPrivateKey = 'GitHub Private Key is required';
            }
        } else if (credential.authenticationType === 'OAuth2') {
            // Cloud Foundry (Deploy) - OAuth2 required fields
            if ((credential.category || category || '').toLowerCase() === 'deploy' && (credential.connector || connector || connectorName || '').toLowerCase() === 'cloud foundry') {
                if (!credential.serviceKeyDetails) {
                    errors.serviceKeyDetails = true;
                    messages.serviceKeyDetails = 'Service Key Details is required';
                }
                if (!credential.oauth2ClientId || !credential.oauth2ClientId.trim()) {
                    errors.oauth2ClientId = true;
                    messages.oauth2ClientId = 'Client ID is required';
                }
                if (!credential.oauth2ClientSecret || !credential.oauth2ClientSecret.trim()) {
                    errors.oauth2ClientSecret = true;
                    messages.oauth2ClientSecret = 'Client Secret is required';
                }
                if (!credential.oauth2TokenUrl || !credential.oauth2TokenUrl.trim()) {
                    errors.oauth2TokenUrl = true;
                    messages.oauth2TokenUrl = 'Token URL is required';
                }
            }
        }

        setValidationErrors(errors);
        setValidationMessages(messages);
        return Object.keys(errors).length === 0;
    };

    const handleSave = () => {
        if (!validateCredential()) {
            return;
        }

        // Ensure credential has the correct context values from props
        const credentialToSave: Credential = {
            ...credential,
            entity: credential.entity || workstream || '',
            product: credential.product || product || '',
            service: credential.service || service || '',
            category: credential.category || category || '',
            connector: credential.connector || connector || connectorName || '',
            scope: credential.scope || credential.connector || connector || connectorName || '',
        };

        onSave([credentialToSave]);
        setHasUnsavedChanges(false);
        setOriginalCredential(JSON.parse(JSON.stringify(credentialToSave)));
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedChangesDialog(true);
        } else {
            onClose();
        }
    };

    const handleDiscardChanges = () => {
        setHasUnsavedChanges(false);
        setShowUnsavedChangesDialog(false);
        onClose();
    };

    const handleKeepEditing = () => {
        setShowUnsavedChangesDialog(false);
    };

    const handleAuthenticationTypeChange = (newValue: string) => {
        updateCredential('authenticationType', newValue);
        
        // Clear Cloud Foundry OAuth2 fields when auth type changes away from OAuth2
        if (newValue !== 'OAuth2') {
            updateCredential('serviceKeyDetails', '');
            updateCredential('oauth2ClientId', '');
            updateCredential('oauth2ClientSecret', '');
            updateCredential('oauth2TokenUrl', '');
        }
        
        // Set default encryption values when authentication type changes
        if (newValue === 'Username and API Key') {
            if (!credential.usernameEncryption) {
                updateCredential('usernameEncryption', 'Plaintext');
            }
            if (!credential.apiKeyEncryption) {
                updateCredential('apiKeyEncryption', 'Encrypted');
            }
        } else if (newValue === 'Personal Access Token') {
            if (!credential.tokenEncryption) {
                updateCredential('tokenEncryption', 'Plaintext');
            }
        } else if (newValue === 'Username and Token') {
            if (!credential.usernameEncryption) {
                updateCredential('usernameEncryption', 'Plaintext');
            }
            if (!credential.tokenEncryption) {
                updateCredential('tokenEncryption', 'Plaintext');
            }
        } else if (newValue === 'GitHub App') {
            if (!credential.githubInstallationIdEncryption) {
                updateCredential('githubInstallationIdEncryption', 'Plaintext');
            }
            if (!credential.githubApplicationIdEncryption) {
                updateCredential('githubApplicationIdEncryption', 'Plaintext');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 overflow-hidden ${!isTopLevelModal ? 'pointer-events-none' : ''}`}
            style={{ zIndex: overlayZIndex }}
        >
            {/* Backdrop - only show for top level modal */}
            {isTopLevelModal && (
                <div 
                    className="absolute inset-0 bg-black bg-opacity-50"
                    onClick={handleClose}
                />
            )}
            
            <motion.div 
                className="absolute right-0 top-0 h-screen shadow-2xl border-l border-gray-200 flex overflow-hidden pointer-events-auto bg-white"
                style={{ width: `${modalWidth}px` }}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Panel - Sidebar Image */}
                <div className="w-10 bg-slate-800 text-white flex flex-col relative h-screen">
                    <img 
                        src="/images/logos/sidebar.png" 
                        alt="Sidebar" 
                        className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
                        <div className="flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide">
                            <Key className="h-4 w-4" />
                            <span>Assign Credentials</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-white overflow-auto">
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-base">Configure Credentials</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex gap-3">
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">Connector Name</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{connectorName || '\u00A0'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-50 overflow-hidden">
                        <div className="h-full overflow-y-auto px-6 py-6">
                            <div className="space-y-6">
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                    {/* Header with Save Button */}
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Key className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Credential Details
                                            </h3>
                                        </div>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center space-x-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 ring-2 ring-blue-300 ring-opacity-50"
                                        >
                                            <BookmarkIcon className="h-4 w-4" />
                                            <span>Save</span>
                                        </button>
                                    </div>

                                    {/* Credential Name Field */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Credential Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={credential.credentialName || ''}
                                            onChange={(e) => updateCredential('credentialName', e.target.value)}
                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                validationErrors.credentialName
                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                            }`}
                                        />
                                        {validationErrors.credentialName && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {validationMessages.credentialName || 'Credential Name is required'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description Field */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={credential.description || ''}
                                            onChange={(e) => updateCredential('description', e.target.value)}
                                            rows={3}
                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                validationErrors.description
                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                            }`}
                                        />
                                        {validationErrors.description && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {validationMessages.description || 'Description must not exceed 500 characters'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Authentication Details Section */}
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <h3 className="text-base font-semibold text-gray-900 mb-4">
                                            Authentication Details
                                        </h3>
                                        {/* Cloud Foundry (Deploy): Service Key Details */}
                                        {(credential.category || category || '').toLowerCase() === 'deploy' &&
                                            (credential.connector || connector || connectorName || '').toLowerCase() === 'cloud foundry' && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Service Key Details *
                                                </label>
                                                <div className="flex items-center gap-6">
                                                    {(['API', 'IFlow'] as const).map((opt) => (
                                                        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                                                            <input
                                                                type="radio"
                                                                name={`serviceKeyDetails-${credential.id}`}
                                                                value={opt}
                                                                checked={credential.serviceKeyDetails === opt}
                                                                disabled={lockServiceKeyDetails && !!serviceKeyDetails && serviceKeyDetails !== opt}
                                                                onChange={() => {
                                                                    if (lockServiceKeyDetails && serviceKeyDetails && serviceKeyDetails !== opt) return;
                                                                    updateCredential('serviceKeyDetails', opt);
                                                                }}
                                                            />
                                                            <span>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {validationErrors.serviceKeyDetails && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {validationMessages.serviceKeyDetails || 'Service Key Details is required'}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Authentication Type
                                            </label>
                                            <AuthenticationTypeDropdown
                                                value={credential.authenticationType || ''}
                                                onChange={(newValue) => handleAuthenticationTypeChange(newValue)}
                                                options={getAuthTypesForConnector(connector || connectorName)}
                                                disabled={(!connector && !connectorName) || getAuthTypesForConnector(connector || connectorName).length === 0}
                                                isError={validationErrors.authenticationType || false}
                                                placeholder="Select authentication type..."
                                            />
                                            {validationErrors.authenticationType && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {validationMessages.authenticationType || 'Authentication Type is required'}
                                                </p>
                                            )}

                                            {/* Conditional fields for OAuth2 (Cloud Foundry) */}
                                            {credential.authenticationType === 'OAuth2' &&
                                                (credential.category || category || '').toLowerCase() === 'deploy' &&
                                                (credential.connector || connector || connectorName || '').toLowerCase() === 'cloud foundry' && (
                                                <div className="mt-4 space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Client ID *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={credential.oauth2ClientId || ''}
                                                            onChange={(e) => updateCredential('oauth2ClientId', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.oauth2ClientId
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.oauth2ClientId && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.oauth2ClientId || 'Client ID is required'}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Client Secret *
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={credential.oauth2ClientSecret || ''}
                                                            onChange={(e) => updateCredential('oauth2ClientSecret', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.oauth2ClientSecret
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.oauth2ClientSecret && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.oauth2ClientSecret || 'Client Secret is required'}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Token URL *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={credential.oauth2TokenUrl || ''}
                                                            onChange={(e) => updateCredential('oauth2TokenUrl', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.oauth2TokenUrl
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.oauth2TokenUrl && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.oauth2TokenUrl || 'Token URL is required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Conditional fields for Username and API Key (Jira) */}
                                            {credential.authenticationType === 'Username and API Key' && (
                                                <div className="mt-4 space-y-4">
                                                    {/* Username field with encryption dropdown */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Username *
                                                            </label>
                                                            <EncryptionTypeDropdown
                                                                value={credential.usernameEncryption || 'Plaintext'}
                                                                onChange={(newValue) => updateCredential('usernameEncryption', newValue)}
                                                                disabled={false}
                                                                isError={false}
                                                                placeholder="Plaintext"
                                                            />
                                                        </div>
                                                        <input
                                                            type={credential.usernameEncryption === 'Encrypted' ? 'password' : 'text'}
                                                            value={credential.username || ''}
                                                            onChange={(e) => updateCredential('username', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.username
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.username && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.username || 'Username is required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* API Key field */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            API Key *
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={credential.apiKey || ''}
                                                            onChange={(e) => updateCredential('apiKey', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.apiKey
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.apiKey && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.apiKey || 'API Key is required'}
                                                            </p>
                                                        )}
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            Default encryption: Encrypted
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Conditional fields for Username and Token (GitHub) */}
                                            {credential.authenticationType === 'Username and Token' && (
                                                <div className="mt-4 space-y-4">
                                                    {/* Username field with encryption dropdown */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Username *
                                                            </label>
                                                            <EncryptionTypeDropdown
                                                                value={credential.usernameEncryption || 'Plaintext'}
                                                                onChange={(newValue) => updateCredential('usernameEncryption', newValue)}
                                                                disabled={false}
                                                                isError={false}
                                                                placeholder="Plaintext"
                                                            />
                                                        </div>
                                                        <input
                                                            type={credential.usernameEncryption === 'Encrypted' ? 'password' : 'text'}
                                                            value={credential.username || ''}
                                                            onChange={(e) => updateCredential('username', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.username
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.username && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.username || 'Username is required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Personal Access Token field */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Personal Access Token *
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={credential.personalAccessToken || ''}
                                                            onChange={(e) => updateCredential('personalAccessToken', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.personalAccessToken
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.personalAccessToken && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.personalAccessToken || 'Personal Access Token is required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Conditional fields for Personal Access Token (Jira) */}
                                            {credential.authenticationType === 'Personal Access Token' && (
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Personal Access Token *
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={credential.personalAccessToken || ''}
                                                        onChange={(e) => updateCredential('personalAccessToken', e.target.value)}
                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                            validationErrors.personalAccessToken
                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {validationErrors.personalAccessToken && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {validationMessages.personalAccessToken || 'Personal Access Token is required'}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Conditional fields for GitHub App */}
                                            {credential.authenticationType === 'GitHub App' && (
                                                <div className="mt-4 space-y-4">
                                                    {/* GitHub Installation Id field with encryption dropdown */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                GitHub Installation Id *
                                                            </label>
                                                            <EncryptionTypeDropdown
                                                                value={credential.githubInstallationIdEncryption || 'Plaintext'}
                                                                onChange={(newValue) => updateCredential('githubInstallationIdEncryption', newValue)}
                                                                disabled={false}
                                                                isError={false}
                                                                placeholder="Plaintext"
                                                            />
                                                        </div>
                                                        <input
                                                            type={credential.githubInstallationIdEncryption === 'Encrypted' ? 'password' : 'text'}
                                                            value={credential.githubInstallationId || ''}
                                                            onChange={(e) => updateCredential('githubInstallationId', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.githubInstallationId
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.githubInstallationId && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.githubInstallationId || 'GitHub Installation Id is required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* GitHub Application Id field with encryption dropdown */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                GitHub Application Id *
                                                            </label>
                                                            <EncryptionTypeDropdown
                                                                value={credential.githubApplicationIdEncryption || 'Plaintext'}
                                                                onChange={(newValue) => updateCredential('githubApplicationIdEncryption', newValue)}
                                                                disabled={false}
                                                                isError={false}
                                                                placeholder="Plaintext"
                                                            />
                                                        </div>
                                                        <input
                                                            type={credential.githubApplicationIdEncryption === 'Encrypted' ? 'password' : 'text'}
                                                            value={credential.githubApplicationId || ''}
                                                            onChange={(e) => updateCredential('githubApplicationId', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.githubApplicationId
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.githubApplicationId && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.githubApplicationId || 'GitHub Application Id is required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* GitHub Private Key field */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            GitHub Private Key *
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={credential.githubPrivateKey || ''}
                                                            onChange={(e) => updateCredential('githubPrivateKey', e.target.value)}
                                                            className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                validationErrors.githubPrivateKey
                                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                    : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                            }`}
                                                        />
                                                        {validationErrors.githubPrivateKey && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {validationMessages.githubPrivateKey || 'GitHub Private Key is required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Conditional fields for OAuth */}
                                            {credential.authenticationType === 'OAuth' && (connector || connectorName || '').toLowerCase() === 'github' && (
                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700 mb-1">GitHub OAuth Authentication</p>
                                                            <p className="text-xs text-gray-500">Connect your GitHub account using OAuth</p>
                                                        </div>
                                                        <OAuthButton
                                                            credentialId={credential.id}
                                                            githubOAuthClientId={githubOAuthClientId}
                                                            loadingOAuthClientId={loadingOAuthClientId}
                                                            credentialName={credential.credentialName || ''}
                                                            setOauthStatus={setOauthStatus}
                                                            setOauthMessage={setOauthMessage}
                                                            disabled={loadingOAuthClientId || !githubOAuthClientId || oauthStatus === 'pending'}
                                                            oauthWindowsRef={oauthWindowsRef}
                                                            selectedAccountId={selectedAccountId}
                                                            selectedAccountName={selectedAccountName}
                                                            selectedEnterpriseId={selectedEnterpriseId}
                                                            selectedEnterprise={selectedEnterprise}
                                                            workstream={workstream}
                                                            product={product}
                                                            service={service}
                                                        />
                                                    </div>
                                                    
                                                    {/* OAuth Status Display */}
                                                    {oauthStatus !== 'idle' && (
                                                        <div className={`mt-3 p-3 rounded-lg ${
                                                            oauthStatus === 'success' 
                                                                ? 'bg-green-50 border border-green-200' 
                                                                : oauthStatus === 'error'
                                                                ? 'bg-red-50 border border-red-200'
                                                                : 'bg-blue-50 border border-blue-200'
                                                        }`}>
                                                            <div className="flex items-center gap-2">
                                                                {oauthStatus === 'pending' && (
                                                                    <motion.div
                                                                        className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                                                                        animate={{ rotate: 360 }}
                                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                                    />
                                                                )}
                                                                {oauthStatus === 'success' && (
                                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                                )}
                                                                {oauthStatus === 'error' && (
                                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                                )}
                                                                <span className={`text-sm font-medium ${
                                                                    oauthStatus === 'success' 
                                                                        ? 'text-green-800' 
                                                                        : oauthStatus === 'error'
                                                                        ? 'text-red-800'
                                                                        : 'text-blue-800'
                                                                }`}>
                                                                    {oauthMessage || (oauthStatus === 'pending' ? 'OAuth in Progress' : oauthStatus === 'success' ? 'OAuth configured successfully' : 'OAuth authorization failed')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Unsaved Changes Confirmation Dialog */}
            <AnimatePresence>
                {showUnsavedChangesDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black bg-opacity-60" />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-amber-100 rounded-full">
                                    <XCircle className="h-5 w-5 text-amber-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Unsaved Changes</h3>
                            </div>
                            
                            <p className="text-slate-600 mb-6">
                                You have unsaved changes. Would you like to save them before closing?
                            </p>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleDiscardChanges}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                                >
                                    No, Discard
                                </button>
                                <button
                                    onClick={handleKeepEditing}
                                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Yes, Keep Editing
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssignedCredentialModal;
