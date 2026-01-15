import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
    X,
    Plus,
    Plug,
    Save,
    Edit2,
    XCircle,
    ChevronDown,
    Check,
    CheckCircle,
    AlertTriangle,
} from 'lucide-react';
import {BookmarkIcon} from '@heroicons/react/24/outline';
import {motion, AnimatePresence} from 'framer-motion';
import {createPortal} from 'react-dom';
import {generateId} from '@/utils/id-generator';
import {api} from '@/utils/api';
import {Icon} from '@/components/Icons';
import {
    TOOLS_CONFIG,
    getToolConfig,
    CATEGORY_ORDER,
} from '@/config/toolsConfig';
import AssignedCredentialModal from './AssignedCredentialModal';
import {CredentialRow} from './ManageCredentialsTable';

export interface Connector {
    id: string;
    category: string;
    connector: string;
    connectorIconName?: string; // Icon name for the selected connector tool
    environmentType?: 'Pre-Production' | 'Production'; // Cloud Foundry target environment
    // Cloud Foundry connectivity fields (Manage Environments)
    apiUrl?: string;
    apiCredentialName?: string;
    iflowUrl?: string;
    iflowCredentialName?: string;
    hostUrl?: string;
    authenticationType: string;
    url?: string; // URL field for connectivity
    credentialName?: string; // Credential name from Manage Credentials
    username?: string;
    usernameEncryption?: string; // 'Plaintext' or 'Encrypted'
    apiKey?: string;
    apiKeyEncryption?: string; // 'Plaintext' or 'Encrypted'
    personalAccessToken?: string;
    tokenEncryption?: string; // 'Plaintext' or 'Encrypted'
    githubInstallationId?: string;
    githubInstallationIdEncryption?: string; // 'Plaintext' or 'Encrypted'
    githubApplicationId?: string;
    githubApplicationIdEncryption?: string; // 'Plaintext' or 'Encrypted'
    githubPrivateKey?: string;
    status: boolean; // true = Active, false = Inactive
    description: string;
}

interface EnvironmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (connectors: Connector[]) => void; // Bulk save functionality
    onSaveIndividual?: (
        connectors: Connector[],
        environmentNameFromModal?: string,
        descriptionFromModal?: string,
    ) => void; // Individual save functionality
    connectorName: string;
    initialConnectors?: Connector[];
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    workstream?: string; // Entity/workstream name
    product?: string; // Product name
    service?: string; // Service name
    rowId?: string; // EnvironmentRow ID for storing connectivity test results in Manage Environments table
    alwaysShowEditForm?: boolean; // If true, always show edit form instead of summary view
    fromBuilds?: boolean; // If true, opened from BuildsTable - fields should be blank and mandatory
    environmentDescription?: string; // Description from the row (for Manage Environments screen)
}

// OAuth Button Component - Uses native event listener to bypass popup blockers
function OAuthButton({
    connectorId,
    githubOAuthClientId,
    loadingOAuthClientId,
    connectorName,
    connectors,
    setOauthStatus,
    setOauthMessages,
    disabled,
    oauthWindowsRef,
}: {
    connectorId: string;
    githubOAuthClientId: string | null;
    loadingOAuthClientId: boolean;
    connectorName: string;
    connectors: Connector[];
    setOauthStatus: React.Dispatch<
        React.SetStateAction<{
            [connectorId: string]: 'idle' | 'pending' | 'success' | 'error';
        }>
    >;
    setOauthMessages: React.Dispatch<
        React.SetStateAction<{[connectorId: string]: string}>
    >;
    disabled: boolean;
    oauthWindowsRef: React.MutableRefObject<Map<string, Window | null>>;
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
                setOauthStatus((prev) => ({...prev, [connectorId]: 'error'}));
                setOauthMessages((prev) => ({
                    ...prev,
                    [connectorId]: loadingOAuthClientId
                        ? 'Loading OAuth configuration...'
                        : 'GitHub OAuth Client ID is not configured. Please configure it in GitHub OAuth Apps settings.',
                }));
                return;
            }

            // Prevent default button behavior
            e.preventDefault();
            e.stopPropagation();

            // CRITICAL: Set status to pending IMMEDIATELY when button is clicked
            // This ensures the UI shows "OAuth in Progress" with loader right away
            setOauthStatus((prev) => ({...prev, [connectorId]: 'pending'}));
            setOauthMessages((prev) => ({
                ...prev,
                [connectorId]: 'OAuth in Progress',
            }));

            // Prepare URL data - keep it minimal
            const state = crypto.randomUUID().replace(/-/g, '');
            const redirectUri = `${window.location.origin}/security-governance/connectors/github/oauth2/callback`;
            const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
                githubOAuthClientId,
            )}&response_type=code&scope=repo&redirect_uri=${encodeURIComponent(
                redirectUri,
            )}&state=${encodeURIComponent(state)}`;

            // CRITICAL: Store OAuth data BEFORE opening window
            // Use multiple storage mechanisms for maximum reliability across tabs
            // Clear previous OAuth flags first
            localStorage.removeItem('githubOAuthSuccess');
            localStorage.removeItem('githubOAuthError');
            localStorage.removeItem('githubOAuthShouldReopenModal');

            // Store in sessionStorage (shared across tabs from same origin)
            sessionStorage.setItem('latestCSRFToken', state);
            sessionStorage.setItem('githubOAuthConnectorId', connectorId);
            sessionStorage.setItem('githubOAuthConnectorName', connectorName);

            // Store in localStorage (backup and for monitoring interval)
            localStorage.setItem('latestCSRFToken', state);
            localStorage.setItem('githubOAuthConnectorId', connectorId);
            localStorage.setItem('githubOAuthConnectorName', connectorName);

            // Store in cookie as ultimate fallback (cookies are definitely shared)
            // Cookie expires in 10 minutes
            const cookieExpiry = new Date(
                Date.now() + 10 * 60 * 1000,
            ).toUTCString();
            document.cookie = `githubOAuthCSRFToken=${state}; expires=${cookieExpiry}; path=/; SameSite=Lax`;
            document.cookie = `githubOAuthConnectorId=${connectorId}; expires=${cookieExpiry}; path=/; SameSite=Lax`;

            console.log(
                '🔑 [OAuth] Stored CSRF token in sessionStorage:',
                state,
            );
            console.log('🔑 [OAuth] Stored CSRF token in localStorage:', state);
            console.log('🔑 [OAuth] Stored CSRF token in cookie:', state);
            console.log('🔑 [OAuth] Stored connector ID:', connectorId);

            // CRITICAL: Open window IMMEDIATELY using native event
            // This bypasses React's synthetic event system
            // Note: We need window.opener to be available, so we can't use 'noopener'
            // Using 'noreferrer' for security instead
            const oauthWindow = window.open(
                oauthUrl,
                '_blank',
                'width=600,height=700,noreferrer',
            );

            // Handle window opening result
            if (oauthWindow) {
                console.log('✅ [OAuth] Window opened successfully');
                // Store window reference so we can close it later
                oauthWindowsRef.current.set(connectorId, oauthWindow);
            } else {
                console.warn(
                    '⚠️ [OAuth] window.open() returned null - popup may have been blocked',
                );
                console.warn(
                    '⚠️ [OAuth] User can manually navigate to:',
                    oauthUrl,
                );
                // Don't clean up storage - keep it so monitoring can detect completion
                // Status will remain 'pending' until success/error is detected
                // Monitoring will continue below
            }

            // Monitor OAuth completion
            // Check both localStorage and listen for storage events for faster detection
            const checkOAuthStatus = () => {
                const storedConnectorId = localStorage.getItem(
                    'githubOAuthConnectorId',
                );
                const oauthSuccess = localStorage.getItem('githubOAuthSuccess');
                const oauthError = localStorage.getItem('githubOAuthError');

                // Only process if this is for our connector
                if (storedConnectorId !== connectorId) {
                    return false;
                }

                if (oauthSuccess === 'true') {
                    console.log(
                        '✅ [OAuth] Success detected for connector:',
                        connectorId,
                    );
                    setOauthStatus((prev) => ({
                        ...prev,
                        [connectorId]: 'success',
                    }));
                    setOauthMessages((prev) => ({
                        ...prev,
                        [connectorId]: 'OAuth configured successfully',
                    }));

                    // Clean up
                    localStorage.removeItem('githubOAuthSuccess');
                    localStorage.removeItem('githubOAuthShouldReopenModal');

                    // Close the OAuth window if it's still open
                    const storedWindow =
                        oauthWindowsRef.current.get(connectorId);
                    if (storedWindow && !storedWindow.closed) {
                        try {
                            console.log(
                                '🔄 [OAuth] Closing OAuth window from parent...',
                            );
                            storedWindow.close();
                            oauthWindowsRef.current.delete(connectorId);
                        } catch (e) {
                            console.error(
                                '❌ [OAuth] Error closing window from parent:',
                                e,
                            );
                        }
                    }
                    return true; // Indicate we found success
                } else if (oauthSuccess === 'false' || oauthError) {
                    console.log(
                        '❌ [OAuth] Error detected for connector:',
                        connectorId,
                    );
                    setOauthStatus((prev) => ({
                        ...prev,
                        [connectorId]: 'error',
                    }));
                    setOauthMessages((prev) => ({
                        ...prev,
                        [connectorId]:
                            oauthError || 'OAuth authorization failed',
                    }));

                    // Clean up
                    localStorage.removeItem('githubOAuthError');
                    localStorage.removeItem('githubOAuthSuccess');

                    // Close the OAuth window if it's still open
                    const storedWindow =
                        oauthWindowsRef.current.get(connectorId);
                    if (storedWindow && !storedWindow.closed) {
                        try {
                            storedWindow.close();
                            oauthWindowsRef.current.delete(connectorId);
                        } catch (e) {
                            console.error(
                                '❌ [OAuth] Error closing window:',
                                e,
                            );
                        }
                    }
                    return true; // Indicate we found error
                }
                return false; // Still waiting
            };

            // Check immediately
            if (checkOAuthStatus()) {
                return; // Already completed
            }

            // Listen for storage events (fires when localStorage changes in other tabs/windows)
            const handleStorageChange = (e: StorageEvent) => {
                if (
                    e.key === 'githubOAuthSuccess' ||
                    e.key === 'githubOAuthError'
                ) {
                    console.log(
                        '📦 [OAuth] Storage event detected:',
                        e.key,
                        e.newValue,
                    );
                    if (checkOAuthStatus()) {
                        window.removeEventListener(
                            'storage',
                            handleStorageChange,
                        );
                    }
                }
            };
            window.addEventListener('storage', handleStorageChange);

            // Also poll periodically as fallback (in case storage events don't fire)
            const checkInterval = setInterval(() => {
                if (checkOAuthStatus()) {
                    clearInterval(checkInterval);
                    window.removeEventListener('storage', handleStorageChange);
                    return;
                }

                // Check if window closed - but keep monitoring even if closed
                // User might complete OAuth in a different tab/window
                if (oauthWindow) {
                    try {
                        if (oauthWindow.closed) {
                            // Window closed - but don't reset status yet
                            // Keep monitoring for success/error in case user completes OAuth elsewhere
                            oauthWindowsRef.current.delete(connectorId);
                            console.log(
                                '🔄 [OAuth] OAuth window closed, but continuing to monitor for completion...',
                            );
                            // Don't clear interval or reset status - let it keep monitoring
                        }
                    } catch (e) {
                        // Cross-origin error - continue monitoring
                    }
                }
                // If oauthWindow is null (blocked), keep monitoring - status stays 'pending'
            }, 300); // Check every 300ms for faster response

            // Cleanup after 10 minutes
            setTimeout(() => {
                clearInterval(checkInterval);
                window.removeEventListener('storage', handleStorageChange);
            }, 600000);
        };

        // Attach native event listener to mousedown
        // mousedown is considered more "direct" user interaction by popup blockers
        // than click, which goes through React's synthetic event system
        button.addEventListener('mousedown', handleNativeClick, true);

        return () => {
            button.removeEventListener('mousedown', handleNativeClick, true);
        };
    }, [
        connectorId,
        githubOAuthClientId,
        loadingOAuthClientId,
        connectorName,
        connectors,
        setOauthStatus,
        setOauthMessages,
        disabled,
    ]);

    return (
        <button
            ref={buttonRef}
            type='button'
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm hover:shadow-md ${
                disabled
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
            <Icon name='github' size={16} className='text-white' />
            <span>
                {loadingOAuthClientId ? 'Loading...' : 'Link to GitHub'}
            </span>
        </button>
    );
}

// Custom Dropdown Component for Category
function CategoryDropdown({
    value,
    onChange,
    options,
    disabled,
    isError,
    placeholder = 'Select category...',
}: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    disabled: boolean;
    isError: boolean;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

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
            if (
                !containerRef.current?.contains(target) &&
                !dropdownRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const displayValue = value
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : placeholder;

    return (
        <div ref={containerRef} className='relative w-full'>
            <button
                type='button'
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`w-full text-left px-2 py-1 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] flex items-center justify-between ${
                    isError
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                        : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
                <span>{displayValue}</span>
                <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>
            {open &&
                dropdownPos &&
                !disabled &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className='z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl'
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                            maxHeight: '240px',
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className='max-h-60 overflow-auto p-2'>
                            {options.length === 0 ? (
                                <div className='px-3 py-2 text-slate-500 text-center text-sm'>
                                    No categories found
                                </div>
                            ) : (
                                options.map((option) => (
                                    <button
                                        key={option}
                                        type='button'
                                        onClick={() => {
                                            onChange(option);
                                            setOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 ${
                                            value === option
                                                ? 'bg-blue-100 font-medium'
                                                : ''
                                        }`}
                                    >
                                        {option.charAt(0).toUpperCase() +
                                            option.slice(1)}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
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
    const [dropdownPos, setDropdownPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

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
            if (
                !containerRef.current?.contains(target) &&
                !dropdownRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const displayValue = value || placeholder;

    return (
        <div ref={containerRef} className='relative'>
            <button
                type='button'
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`px-2 py-1 pr-6 text-sm font-normal text-black not-italic focus:outline-none bg-transparent border-0 hover:bg-gray-50 rounded flex items-center gap-1 ${
                    disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer'
                }`}
                style={{
                    color: '#000000',
                    fontStyle: 'normal',
                    fontFamily: 'inherit',
                }}
            >
                <span>{displayValue}</span>
                <ChevronDown
                    className={`h-3 w-3 text-gray-500 transition-transform ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>
            {open &&
                dropdownPos &&
                !disabled &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className='z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl'
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                            maxHeight: '240px',
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className='max-h-60 overflow-auto p-2'>
                            {options.map((option) => (
                                <button
                                    key={option}
                                    type='button'
                                    onClick={() => {
                                        onChange(option);
                                        setOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 ${
                                        value === option
                                            ? 'bg-blue-100 font-medium'
                                            : ''
                                    }`}
                                    style={{
                                        color: '#000000',
                                        fontStyle: 'normal',
                                        fontWeight:
                                            value === option ? '500' : 'normal',
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

// Custom Dropdown Component for Credential Name - filters by Account, Enterprise, Workstream, Product, and Service
function CredentialNameDropdown({
    value,
    onChange,
    disabled = false,
    isError = false,
    placeholder = 'Select credential name...',
    selectedAccountId = '',
    selectedAccountName = '',
    selectedEnterpriseId = '',
    selectedEnterprise = '',
    workstream = '',
    product = '',
    service = '',
    connector = '',
    category = '',
    serviceKeyDetails = '',
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isError?: boolean;
    placeholder?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    selectedEnterpriseId?: string;
    selectedEnterprise?: string;
    workstream?: string;
    product?: string;
    service?: string;
    connector?: string;
    category?: string;
    serviceKeyDetails?: string;
}) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<Array<{id: string; name: string}>>(
        [],
    );
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

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
            window.addEventListener('resize', handleReposition);
            window.addEventListener('scroll', handleReposition, true);
            return () => {
                window.removeEventListener('resize', handleReposition);
                window.removeEventListener('scroll', handleReposition, true);
            };
        }
    }, [open, calculateDropdownPosition]);

    // Load credentials from API filtered by Account, Enterprise, Workstream (Entity), Product, and Service
    const loadCredentials = useCallback(async () => {
        setLoading(true);
        try {
            // Check if we have required account and enterprise info
            if (!selectedAccountId) {
                console.log(
                    '⚠️ [CredentialDropdown] Cannot load - missing accountId',
                );
                setOptions([]);
                setLoading(false);
                return;
            }

            // Load credentials from API
            const queryParams = new URLSearchParams({
                accountId: selectedAccountId,
            });
            if (selectedEnterpriseId) {
                queryParams.append('enterpriseId', selectedEnterpriseId);
            }

            console.log(
                '🔍 [CredentialDropdown] Loading credentials from API...',
            );
            const response = (await api.get(
                `/api/credentials?${queryParams.toString()}`,
            )) as {data?: CredentialRow[]; error?: string} | CredentialRow[];

            let allCredentials: CredentialRow[] = [];
            if (Array.isArray(response)) {
                allCredentials = response;
            } else if (response && !response.error && response.data) {
                allCredentials = response.data;
            } else if (response && response.error) {
                console.error(
                    '❌ [CredentialDropdown] API error:',
                    response.error,
                );
                setOptions([]);
                setLoading(false);
                return;
            }

            console.log(
                '📦 [CredentialDropdown] Loaded',
                allCredentials.length,
                'credentials from API',
            );
            console.log(
                '📦 [CredentialDropdown] Sample credential structure:',
                allCredentials.length > 0
                    ? allCredentials[0]
                    : 'No credentials',
            );

            // Filter credentials by account, enterprise, entity (workstream), product, service, and connector/category/serviceKeyDetails
            const filteredCredentials = allCredentials.filter((credential) => {
                // Match entity (workstream) - case-insensitive
                const entityMatch =
                    !workstream ||
                    !credential.entity ||
                    credential.entity.toLowerCase() ===
                        workstream.toLowerCase();

                // Match product - case-insensitive
                const productMatch =
                    !product ||
                    !credential.product ||
                    credential.product.toLowerCase() === product.toLowerCase();

                // Match service - case-insensitive
                const serviceMatch =
                    !service ||
                    !credential.service ||
                    credential.service.toLowerCase() === service.toLowerCase();

                // Match connector/category/serviceKeyDetails - only show credentials that have a matching connector entry
                let connectorMatch = true;
                if (connector && connector.trim()) {
                    if (
                        credential.connectors &&
                        credential.connectors.length > 0
                    ) {
                        connectorMatch = credential.connectors.some(
                            (c: any) => {
                                const matchesConnector =
                                    c.connector &&
                                    c.connector.toLowerCase() ===
                                        connector.toLowerCase();
                                const matchesCategory =
                                    !category ||
                                    !c.category ||
                                    c.category.toLowerCase() ===
                                        category.toLowerCase();
                                const matchesServiceKey =
                                    !serviceKeyDetails ||
                                    !c.serviceKeyDetails ||
                                    String(
                                        c.serviceKeyDetails,
                                    ).toLowerCase() ===
                                        String(serviceKeyDetails).toLowerCase();
                                return (
                                    matchesConnector &&
                                    matchesCategory &&
                                    matchesServiceKey
                                );
                            },
                        );
                    } else {
                        connectorMatch = false;
                    }
                }

                return (
                    entityMatch &&
                    productMatch &&
                    serviceMatch &&
                    connectorMatch
                );
            });

            console.log(
                '🔍 [CredentialDropdown] Filtered to',
                filteredCredentials.length,
                'credentials matching filters:',
                {
                    workstream,
                    product,
                    service,
                    connector,
                    category,
                    serviceKeyDetails,
                },
            );
            console.log(
                '🔍 [CredentialDropdown] Filtered credentials:',
                filteredCredentials,
            );

            // Extract unique credential names
            const credentialMap = new Map<string, {id: string; name: string}>();
            filteredCredentials.forEach((credential) => {
                console.log('🔍 [CredentialDropdown] Processing credential:', {
                    id: credential.id,
                    credentialName: credential.credentialName,
                    entity: credential.entity,
                    product: credential.product,
                    service: credential.service,
                });

                // Handle credentialName - check multiple possible field names
                const credentialName =
                    credential.credentialName || (credential as any).name || '';
                if (
                    credentialName &&
                    typeof credentialName === 'string' &&
                    credentialName.trim()
                ) {
                    const name = credentialName.trim();
                    if (!credentialMap.has(name.toLowerCase())) {
                        credentialMap.set(name.toLowerCase(), {
                            id: credential.id || String(Math.random()),
                            name: name,
                        });
                        console.log(
                            '✅ [CredentialDropdown] Added credential name to map:',
                            name,
                        );
                    }
                } else {
                    console.log(
                        '⚠️ [CredentialDropdown] Skipping credential - no credentialName or empty:',
                        {
                            credential,
                            credentialName: credential.credentialName,
                            hasCredentialName: !!credential.credentialName,
                            credentialNameType:
                                typeof credential.credentialName,
                        },
                    );
                }
            });

            const credentialOptions = Array.from(credentialMap.values());
            console.log(
                '📋 [CredentialDropdown] Final credential options:',
                credentialOptions,
            );
            console.log(
                '📋 [CredentialDropdown] Setting options with',
                credentialOptions.length,
                'items',
            );
            setOptions(credentialOptions);
            console.log(
                '📋 [CredentialDropdown] Options set, state should update soon',
            );
        } catch (error) {
            console.error(
                '❌ [CredentialDropdown] Error loading credentials from API:',
                error,
            );
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [
        selectedAccountId,
        selectedEnterpriseId,
        workstream,
        product,
        service,
        connector,
        category,
        serviceKeyDetails,
    ]);

    useEffect(() => {
        if (open) {
            loadCredentials();
        }
    }, [open, loadCredentials]);

    // Refresh credentials when filters change (even if dropdown is already open)
    useEffect(() => {
        if (open && selectedAccountId && selectedEnterpriseId) {
            loadCredentials();
        }
    }, [
        open,
        selectedAccountId,
        selectedEnterpriseId,
        workstream,
        product,
        service,
        connector,
        category,
        serviceKeyDetails,
        loadCredentials,
    ]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedInsideTrigger =
                !!containerRef.current && containerRef.current.contains(target);
            const clickedInsideDropdown =
                !!dropdownRef.current && dropdownRef.current.contains(target);
            if (!clickedInsideTrigger && !clickedInsideDropdown) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    const selectedOption = options.find((opt) => opt.name === value);
    // If value is set but not in options (due to filtering/refresh), still display the value
    const displayValue =
        value && value.trim()
            ? selectedOption
                ? selectedOption.name
                : value
            : '';

    return (
        <div ref={containerRef} className='relative w-full'>
            <button
                type='button'
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`w-full px-2 py-1 border rounded-lg text-sm text-left focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] flex items-center justify-between ${
                    isError
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                        : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                } ${
                    disabled
                        ? 'bg-gray-100 cursor-not-allowed'
                        : 'cursor-pointer'
                }`}
            >
                <span
                    className={displayValue ? 'text-gray-900' : 'text-gray-500'}
                >
                    {displayValue || placeholder}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                        open ? 'transform rotate-180' : ''
                    }`}
                />
            </button>

            {open &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className='fixed z-[10050] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto'
                        style={
                            dropdownPos
                                ? {
                                      top: `${dropdownPos.top}px`,
                                      left: `${dropdownPos.left}px`,
                                      width: `${dropdownPos.width}px`,
                                  }
                                : undefined
                        }
                    >
                        {loading ? (
                            <div className='px-3 py-2 text-sm text-gray-500'>
                                Loading...
                            </div>
                        ) : options.length === 0 ? (
                            <div className='px-3 py-2 text-sm text-gray-500'>
                                No credentials found
                            </div>
                        ) : (
                            options.map((option) => (
                                <button
                                    key={option.id}
                                    type='button'
                                    onClick={() => {
                                        onChange(option.name);
                                        setOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                        value === option.name
                                            ? 'bg-blue-100 font-medium'
                                            : ''
                                    }`}
                                >
                                    {option.name}
                                </button>
                            ))
                        )}
                    </div>,
                    document.body,
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
    onValueChange?: (value: string) => void; // Callback for additional logic when value changes
    options?: string[]; // Dynamic options based on connector
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

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
            if (
                !containerRef.current?.contains(target) &&
                !dropdownRef.current?.contains(target)
            ) {
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
        <div ref={containerRef} className='relative w-full'>
            <button
                type='button'
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
                    fontFamily: 'inherit',
                }}
            >
                <span>{displayValue}</span>
                <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>
            {open &&
                dropdownPos &&
                !disabled &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className='z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl'
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                            maxHeight: '240px',
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className='max-h-60 overflow-auto p-2'>
                            {options.length === 0 ? (
                                <div className='px-3 py-2 text-slate-500 text-center text-sm'>
                                    No options found
                                </div>
                            ) : (
                                options.map((option) => (
                                    <button
                                        key={option}
                                        type='button'
                                        onClick={() =>
                                            handleOptionClick(option)
                                        }
                                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 ${
                                            value === option
                                                ? 'bg-blue-100 font-medium'
                                                : ''
                                        }`}
                                        style={{
                                            color: '#000000',
                                            fontStyle: 'normal',
                                            fontWeight:
                                                value === option
                                                    ? '500'
                                                    : 'normal',
                                        }}
                                    >
                                        {option}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

// Custom Dropdown Component for Connector
function ConnectorDropdown({
    value,
    onChange,
    options,
    disabled,
    isError,
    placeholder = 'Select connector...',
    iconName,
}: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    disabled: boolean;
    isError: boolean;
    placeholder?: string;
    iconName?: string;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

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
            if (
                !containerRef.current?.contains(target) &&
                !dropdownRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const displayValue = value || placeholder;

    return (
        <div ref={containerRef} className='relative w-full'>
            <button
                type='button'
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`w-full text-left ${
                    iconName && value ? 'pl-8' : 'pl-2'
                } pr-8 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] flex items-center justify-between ${
                    isError
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                        : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
                <div className='flex items-center gap-2 flex-1 min-w-0'>
                    {iconName && value && (
                        <Icon
                            name={iconName}
                            size={16}
                            className='text-gray-600 flex-shrink-0'
                        />
                    )}
                    <span className='truncate'>{displayValue}</span>
                </div>
                <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>
            {open &&
                dropdownPos &&
                !disabled &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className='z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl'
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                            maxHeight: '240px',
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className='max-h-60 overflow-auto p-2'>
                            {options.length === 0 ? (
                                <div className='px-3 py-2 text-slate-500 text-center text-sm'>
                                    No connectors found
                                </div>
                            ) : (
                                options.map((option) => {
                                    const toolConfig = getToolConfig(option);
                                    return (
                                        <button
                                            key={option}
                                            type='button'
                                            onClick={() => {
                                                onChange(option);
                                                setOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 flex items-center gap-2 ${
                                                value === option
                                                    ? 'bg-blue-100 font-medium'
                                                    : ''
                                            }`}
                                        >
                                            {toolConfig && (
                                                <Icon
                                                    name={toolConfig.iconName}
                                                    size={16}
                                                    className='text-gray-600'
                                                />
                                            )}
                                            {option}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

const EnvironmentModal: React.FC<EnvironmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onSaveIndividual,
    connectorName,
    initialConnectors = [],
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
    workstream = '',
    product = '',
    service = '',
    rowId,
    alwaysShowEditForm = false,
    fromBuilds = false,
    environmentDescription: propEnvironmentDescription = '',
}) => {
    // Manage Environments currently only supports a fixed connector
    const FIXED_CATEGORY_VALUE = 'deploy';
    const FIXED_CATEGORY_LABEL = 'Deploy';
    const FIXED_CONNECTOR_VALUE = 'Cloud Foundry';

    // State for Environment Name and Description (header fields)
    const [environmentNameState, setEnvironmentNameState] =
        useState<string>('');
    const [environmentDescription, setEnvironmentDescription] =
        useState<string>('');

    const [credentialModalTarget, setCredentialModalTarget] = useState<
        'api' | 'iflow'
    >('api');
    const [credentialModalConnectorId, setCredentialModalConnectorId] =
        useState<string | null>(null);

    const [connectors, setConnectors] = useState<Connector[]>([
        {
            id: generateId(),
            category: FIXED_CATEGORY_VALUE,
            connector: FIXED_CONNECTOR_VALUE,
            connectorIconName: getToolConfig(FIXED_CONNECTOR_VALUE)?.iconName,
            environmentType: undefined,
            apiUrl: '',
            apiCredentialName: '',
            iflowUrl: '',
            iflowCredentialName: '',
            hostUrl: '',
            authenticationType: '',
            url: '',
            credentialName: '',
            username: '',
            usernameEncryption: 'Plaintext',
            apiKey: '',
            apiKeyEncryption: 'Encrypted', // Default to Encrypted
            personalAccessToken: '',
            tokenEncryption: 'Plaintext',
            status: true, // Default to Active (true)
            description: '',
        },
    ]);

    // Global Settings data state
    const [globalSettingsData, setGlobalSettingsData] = useState<
        Record<string, string[]>
    >({});
    const [availableCategories, setAvailableCategories] = useState<string[]>(
        [],
    );
    const [loadingGlobalSettings, setLoadingGlobalSettings] = useState(false);
    const [editingConnectorId, setEditingConnectorId] = useState<string | null>(
        null,
    );
    const [activelyEditingNewConnector, setActivelyEditingNewConnector] =
        useState<Set<string>>(new Set());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
        useState(false);
    const [originalConnectors, setOriginalConnectors] = useState<Connector[]>(
        [],
    );
    const [validationErrors, setValidationErrors] = useState<{
        [key: string]: string[];
    }>({});
    const [validationMessages, setValidationMessages] = useState<{
        [key: string]: Record<string, string>;
    }>({});

    // OAuth state tracking
    const [oauthStatus, setOauthStatus] = useState<{
        [connectorId: string]: 'idle' | 'pending' | 'success' | 'error';
    }>({});
    const [oauthMessages, setOauthMessages] = useState<{
        [connectorId: string]: string;
    }>({});
    const [githubOAuthClientId, setGithubOAuthClientId] = useState<
        string | null
    >(null);
    const [loadingOAuthClientId, setLoadingOAuthClientId] = useState(false);
    const [showCredentialModal, setShowCredentialModal] = useState(false);
    // Connectivity test state (EnvironmentModal)
    const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
    const [connectivityTestStatus, setConnectivityTestStatus] = useState<
        'idle' | 'success' | 'failed'
    >('idle');
    const [connectivityTestMessage, setConnectivityTestMessage] =
        useState<string>('');
    const [connectivityTestTime, setConnectivityTestTime] =
        useState<Date | null>(null);
    // Store OAuth window references so we can close them from the parent
    const oauthWindowsRef = useRef<Map<string, Window | null>>(new Map());
    // Ref to track OAuth status for preserving during modal reopen
    const oauthStatusRef = useRef<{
        [connectorId: string]: 'idle' | 'pending' | 'success' | 'error';
    }>({});

    // Sync ref with state whenever status changes
    useEffect(() => {
        oauthStatusRef.current = oauthStatus;
    }, [oauthStatus]);

    // Helper function to check if a connector is complete
    const isConnectorComplete = (connector: Connector): boolean => {
        return !!(connector.category?.trim() && connector.connector?.trim());
    };

    const validateConnector = (
        connector: Connector,
    ): {errors: string[]; messages: Record<string, string>} => {
        const errors: string[] = [];
        const messages: Record<string, string> = {};

        // Validate Category - required
        if (!connector.category || !connector.category.trim()) {
            errors.push('category');
            messages.category = 'Category is required';
        }

        // Validate Connector - required
        if (!connector.connector || !connector.connector.trim()) {
            errors.push('connector');
            messages.connector = 'Connector is required';
        }

        // Cloud Foundry: Environment Type is required
        if (connector.connector === FIXED_CONNECTOR_VALUE) {
            if (!connector.environmentType) {
                errors.push('environmentType');
                messages.environmentType =
                    'Please select Pre-Production or Production';
            }

            if (!connector.apiUrl || !connector.apiUrl.trim()) {
                errors.push('apiUrl');
                messages.apiUrl = 'API URL is required';
            }
            if (
                !connector.apiCredentialName ||
                !connector.apiCredentialName.trim()
            ) {
                errors.push('apiCredentialName');
                messages.apiCredentialName = 'API Credential Name is required';
            }
            if (!connector.iflowUrl || !connector.iflowUrl.trim()) {
                errors.push('iflowUrl');
                messages.iflowUrl = 'IFlow URL is required';
            }
            if (
                !connector.iflowCredentialName ||
                !connector.iflowCredentialName.trim()
            ) {
                errors.push('iflowCredentialName');
                messages.iflowCredentialName =
                    'IFlow Credential Name is required';
            }
            if (!connector.hostUrl || !connector.hostUrl.trim()) {
                errors.push('hostUrl');
                messages.hostUrl = 'Host URL is required';
            }
        }

        // Legacy URL/Credential (used by other connectors; not Cloud Foundry)
        if (connector.connector !== FIXED_CONNECTOR_VALUE) {
            if (!connector.url || !connector.url.trim()) {
                errors.push('url');
                messages.url = 'URL is required';
            }
            if (!connector.credentialName || !connector.credentialName.trim()) {
                errors.push('credentialName');
                messages.credentialName = 'Credential Name is required';
            }
        }

        // Validate Authentication Type - optional now (kept for backward compatibility)

        // Validate Username and API Key - required if authentication type is Username and API Key (Jira)
        if (connector.authenticationType === 'Username and API Key') {
            if (!connector.username || !connector.username.trim()) {
                errors.push('username');
                messages.username = 'Username is required';
            }
            if (!connector.apiKey || !connector.apiKey.trim()) {
                errors.push('apiKey');
                messages.apiKey = 'API Key is required';
            }
        }

        // Validate Username and Token - required if authentication type is Username and Token (GitHub)
        if (connector.authenticationType === 'Username and Token') {
            if (!connector.username || !connector.username.trim()) {
                errors.push('username');
                messages.username = 'Username is required';
            }
            if (
                !connector.personalAccessToken ||
                !connector.personalAccessToken.trim()
            ) {
                errors.push('personalAccessToken');
                messages.personalAccessToken =
                    'Personal Access Token is required';
            }
        }

        // Validate Personal Access Token - required if authentication type is Personal Access Token (Jira)
        if (connector.authenticationType === 'Personal Access Token') {
            if (
                !connector.personalAccessToken ||
                !connector.personalAccessToken.trim()
            ) {
                errors.push('personalAccessToken');
                messages.personalAccessToken =
                    'Personal Access Token is required';
            }
        }

        // Validate GitHub App - required if authentication type is GitHub App
        if (connector.authenticationType === 'GitHub App') {
            if (
                !connector.githubInstallationId ||
                !connector.githubInstallationId.trim()
            ) {
                errors.push('githubInstallationId');
                messages.githubInstallationId =
                    'GitHub Installation Id is required';
            }
            if (
                !connector.githubApplicationId ||
                !connector.githubApplicationId.trim()
            ) {
                errors.push('githubApplicationId');
                messages.githubApplicationId =
                    'GitHub Application Id is required';
            }
            if (
                !connector.githubPrivateKey ||
                !connector.githubPrivateKey.trim()
            ) {
                errors.push('githubPrivateKey');
                messages.githubPrivateKey = 'GitHub Private Key is required';
            }
        }

        // Validate Description (optional, but if provided should be valid)
        if (
            connector.description &&
            connector.description.trim().length > 500
        ) {
            errors.push('description');
            messages.description = 'Description must not exceed 500 characters';
        }

        return {errors, messages};
    };

    const testEnvironmentConnectivity = async (connectorId: string) => {
        const connector = connectors.find((c) => c.id === connectorId);
        if (!connector) return;

        const loadCredentialAuthDetails = () => {
            try {
                const accountId =
                    selectedAccountId ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedAccountId')
                        : '') ||
                    '';
                const enterpriseId =
                    selectedEnterpriseId ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedEnterpriseId')
                        : '') ||
                    '';

                if (!accountId || !enterpriseId) {
                    return {
                        error: 'Missing account or enterprise context.' as const,
                    };
                }

                const LOCAL_STORAGE_CREDENTIALS_KEY =
                    'credentials_credentials_data';
                const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${accountId}_${enterpriseId}`;
                const stored =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem(storageKey)
                        : null;
                if (!stored) {
                    return {
                        error: 'No credentials found for selected account and enterprise.' as const,
                    };
                }

                const allCredentials: CredentialRow[] = JSON.parse(stored);
                const credentialName =
                    connector.iflowCredentialName?.trim() || '';
                if (!credentialName) {
                    return {error: 'Missing IFlow credential name.' as const};
                }

                const row = allCredentials.find((c) => {
                    const nameMatch =
                        (c.credentialName || '').trim() === credentialName;
                    const entityMatch =
                        !workstream ||
                        !c.entity ||
                        c.entity.toLowerCase() ===
                            String(workstream).toLowerCase();
                    const productMatch =
                        !product ||
                        !c.product ||
                        c.product.toLowerCase() ===
                            String(product).toLowerCase();
                    const serviceMatch =
                        !service ||
                        !c.service ||
                        c.service.toLowerCase() ===
                            String(service).toLowerCase();
                    return (
                        nameMatch && entityMatch && productMatch && serviceMatch
                    );
                });

                if (!row) {
                    return {
                        error: 'Selected credential name was not found for the current workstream/product/service context.' as const,
                    };
                }

                const connectorConfig = row.connectors?.find((cfg) => {
                    const matchesCategory =
                        (cfg.category || '').toLowerCase() === 'deploy';
                    const matchesConnector =
                        (cfg.connector || '').toLowerCase() === 'cloud foundry';
                    const matchesServiceKey =
                        (cfg.serviceKeyDetails || '').toLowerCase() === 'iflow';
                    return (
                        matchesCategory && matchesConnector && matchesServiceKey
                    );
                });

                if (!connectorConfig) {
                    return {
                        error: 'Credential does not include Cloud Foundry (IFlow) connector configuration.' as const,
                    };
                }

                const authenticationType =
                    connectorConfig.authenticationType || '';
                if (!authenticationType) {
                    return {
                        error: 'Credential is missing authentication type for Cloud Foundry.' as const,
                    };
                }

                if (authenticationType === 'OAuth2') {
                    const oauth2ClientId = connectorConfig.oauth2ClientId || '';
                    const oauth2ClientSecret =
                        connectorConfig.oauth2ClientSecret || '';
                    const oauth2TokenUrl = connectorConfig.oauth2TokenUrl || '';
                    if (
                        !oauth2ClientId ||
                        !oauth2ClientSecret ||
                        !oauth2TokenUrl
                    ) {
                        return {
                            error: 'OAuth2 credential is missing Client ID, Client Secret, or Token URL.' as const,
                        };
                    }
                    return {
                        authenticationType,
                        oauth2ClientId,
                        oauth2ClientSecret,
                        oauth2TokenUrl,
                    };
                }

                // Default: treat as Basic Auth style credential using username + apiKey (as stored in localStorage schema)
                const username = connectorConfig.username || '';
                const apiKey = connectorConfig.apiKey || '';
                if (!username || !apiKey) {
                    return {
                        error: 'Basic Auth credential is missing username or secret.' as const,
                    };
                }
                return {
                    authenticationType,
                    username,
                    apiKey,
                };
            } catch (e) {
                console.error(
                    '❌ [EnvironmentModal] Failed to load credential auth details:',
                    e,
                );
                return {
                    error: 'Failed to load credential details from local storage.' as const,
                };
            }
        };

        // Ensure all required fields are present (for Cloud Foundry)
        const allFilled = !!(
            connector.environmentType &&
            connector.iflowCredentialName?.trim() &&
            connector.hostUrl?.trim()
        );
        if (!allFilled) {
            setConnectivityTestStatus('failed');
            setConnectivityTestMessage(
                'Please fill IFlow Credential Name and Host URL before testing.',
            );
            setConnectivityTestTime(new Date());
            return;
        }

        // Validate context is present
        const accountId =
            selectedAccountId ||
            (typeof window !== 'undefined'
                ? window.localStorage.getItem('selectedAccountId')
                : '') ||
            '';
        const accountName =
            selectedAccountName ||
            (typeof window !== 'undefined'
                ? window.localStorage.getItem('selectedAccountName')
                : '') ||
            '';
        const enterpriseId =
            selectedEnterpriseId ||
            (typeof window !== 'undefined'
                ? window.localStorage.getItem('selectedEnterpriseId')
                : '') ||
            '';
        const enterpriseName =
            selectedEnterprise ||
            (typeof window !== 'undefined'
                ? window.localStorage.getItem('selectedEnterpriseName')
                : '') ||
            '';

        if (!accountId || !enterpriseId) {
            setConnectivityTestStatus('failed');
            setConnectivityTestMessage(
                'Missing account or enterprise context.',
            );
            setConnectivityTestTime(new Date());
            return;
        }

        const credentialAuthDetails = loadCredentialAuthDetails();
        if ('error' in credentialAuthDetails) {
            setConnectivityTestStatus('failed');
            setConnectivityTestMessage(
                String(
                    credentialAuthDetails.error ||
                        'Failed to load credential details.',
                ),
            );
            setConnectivityTestTime(new Date());
            return;
        }

        const testPayload: any = {
            accountId,
            accountName,
            enterpriseId,
            enterpriseName,
            workstream: workstream || '',
            product: product || '',
            service: service || '',
            credentialName: connector.iflowCredentialName,
            hostUrl: connector.hostUrl,
            ...credentialAuthDetails,
        };

        console.log(
            '🧪 [EnvironmentModal] Sending environment connectivity test:',
            testPayload,
        );

        setIsTestingConnectivity(true);
        setConnectivityTestStatus('idle');
        setConnectivityTestMessage('Test in Progress');
        setConnectivityTestTime(null);

        const minDurationMs = 2500;
        const startedAt = Date.now();

        try {
            const response = await api.post<{
                success?: boolean;
                status?: string;
                connected?: boolean;
                message?: string;
            }>('/api/environments/cloudfoundry/test-connection', testPayload);

            const elapsed = Date.now() - startedAt;
            if (elapsed < minDurationMs) {
                await new Promise((resolve) =>
                    setTimeout(resolve, minDurationMs - elapsed),
                );
            }

            const success = !!(
                response &&
                (response.success ||
                    response.status === 'success' ||
                    response.connected)
            );
            setConnectivityTestStatus(success ? 'success' : 'failed');
            setConnectivityTestMessage(
                response?.message || (success ? 'Success' : 'Failed'),
            );
            setConnectivityTestTime(new Date());

            // Persist test result for Manage Environments Status column
            if (accountId && enterpriseId) {
                try {
                    const STORAGE_KEY = `environment_test_results_${accountId}_${enterpriseId}`;
                    const stored =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem(STORAGE_KEY)
                            : null;
                    const results: Record<
                        string,
                        {status: 'success' | 'failed'; timestamp: number}
                    > = stored ? JSON.parse(stored) : {};

                    // If rowId is available, use it; otherwise use environmentName as key (will be migrated when environment is saved)
                    const resultKey =
                        rowId ||
                        (environmentNameState
                            ? `temp_${environmentNameState}_${workstream}_${product}_${service}`
                            : null);

                    if (resultKey) {
                        results[resultKey] = {
                            status: success ? 'success' : 'failed',
                            timestamp: Date.now(),
                        };
                        if (typeof window !== 'undefined') {
                            window.localStorage.setItem(
                                STORAGE_KEY,
                                JSON.stringify(results),
                            );
                            console.log(
                                '💾 [EnvironmentModal] Saved test result to localStorage for key:',
                                resultKey,
                                'status:',
                                success ? 'success' : 'failed',
                                'rowId:',
                                rowId || 'none (using temp key)',
                            );
                            window.dispatchEvent(
                                new Event('environmentTestResultUpdated'),
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        '❌ [EnvironmentModal] Error saving test result to localStorage:',
                        error,
                    );
                }
            }
        } catch (err: any) {
            const elapsed = Date.now() - startedAt;
            if (elapsed < minDurationMs) {
                await new Promise((resolve) =>
                    setTimeout(resolve, minDurationMs - elapsed),
                );
            }
            const msg = err?.message || 'Connectivity test failed';
            setConnectivityTestStatus('failed');
            setConnectivityTestMessage(msg);
            setConnectivityTestTime(new Date());

            // Persist failed test result for Manage Environments Status column
            if (accountId && enterpriseId) {
                try {
                    const STORAGE_KEY = `environment_test_results_${accountId}_${enterpriseId}`;
                    const stored =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem(STORAGE_KEY)
                            : null;
                    const results: Record<
                        string,
                        {status: 'success' | 'failed'; timestamp: number}
                    > = stored ? JSON.parse(stored) : {};

                    // If rowId is available, use it; otherwise use environmentName as key (will be migrated when environment is saved)
                    const resultKey =
                        rowId ||
                        (environmentNameState
                            ? `temp_${environmentNameState}_${workstream}_${product}_${service}`
                            : null);

                    if (resultKey) {
                        results[resultKey] = {
                            status: 'failed',
                            timestamp: Date.now(),
                        };
                        if (typeof window !== 'undefined') {
                            window.localStorage.setItem(
                                STORAGE_KEY,
                                JSON.stringify(results),
                            );
                            console.log(
                                '💾 [EnvironmentModal] Saved failed test result to localStorage for key:',
                                resultKey,
                                'rowId:',
                                rowId || 'none (using temp key)',
                            );
                            window.dispatchEvent(
                                new Event('environmentTestResultUpdated'),
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        '❌ [EnvironmentModal] Error saving failed test result to localStorage:',
                        error,
                    );
                }
            }
        } finally {
            setIsTestingConnectivity(false);
        }
    };

    // When modal opens (or initialConnectors changes), ensure fixed Category/Connector are always enforced
    useEffect(() => {
        if (!isOpen) return;

        const toolConfig = getToolConfig(FIXED_CONNECTOR_VALUE);

        setConnectors((prev) => {
            const source =
                initialConnectors && initialConnectors.length > 0
                    ? initialConnectors
                    : prev;
            const normalized = (source.length > 0 ? source : prev).map((c) => ({
                ...c,
                category: FIXED_CATEGORY_VALUE,
                connector: FIXED_CONNECTOR_VALUE,
                connectorIconName: toolConfig?.iconName || c.connectorIconName,
            }));

            // Ensure at least one connector exists
            if (normalized.length === 0) {
                return [
                    {
                        id: generateId(),
                        category: FIXED_CATEGORY_VALUE,
                        connector: FIXED_CONNECTOR_VALUE,
                        connectorIconName: toolConfig?.iconName,
                        environmentType: undefined,
                        authenticationType: '',
                        url: '',
                        credentialName: '',
                        username: '',
                        usernameEncryption: 'Plaintext',
                        apiKey: '',
                        apiKeyEncryption: 'Encrypted',
                        personalAccessToken: '',
                        tokenEncryption: 'Plaintext',
                        status: true,
                        description: '',
                    },
                ];
            }

            return normalized;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialConnectors]);

    const validateAllConnectors = (): boolean => {
        const errors: {[key: string]: string[]} = {};
        const messages: {[key: string]: Record<string, string>} = {};
        let hasErrors = false;

        connectors.forEach((connector) => {
            const validation = validateConnector(connector);
            if (validation.errors.length > 0) {
                errors[connector.id] = validation.errors;
                messages[connector.id] = validation.messages;
                hasErrors = true;
            }
        });

        setValidationErrors(errors);
        setValidationMessages(messages);
        return !hasErrors;
    };

    // Listen for OAuth messages from callback window and check localStorage
    useEffect(() => {
        if (!isOpen) return;

        const handleOAuthMessage = (event: MessageEvent) => {
            // Verify message origin for security
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data.type === 'GITHUB_OAUTH_SUCCESS') {
                const connectorId = event.data.connectorId;
                if (
                    connectorId &&
                    connectors.some((c) => c.id === connectorId)
                ) {
                    console.log(
                        '✅ [OAuth] GitHub OAuth successful for connector:',
                        connectorId,
                    );
                    setOauthStatus((prev) => ({
                        ...prev,
                        [connectorId]: 'success',
                    }));
                    setOauthMessages((prev) => ({
                        ...prev,
                        [connectorId]: 'OAuth configured successfully',
                    }));

                    // Close the OAuth window
                    const oauthWindow =
                        oauthWindowsRef.current.get(connectorId);
                    if (oauthWindow && !oauthWindow.closed) {
                        try {
                            console.log(
                                '🔄 [OAuth] Closing OAuth window after success message...',
                            );
                            oauthWindow.close();
                            oauthWindowsRef.current.delete(connectorId);
                        } catch (e) {
                            console.error(
                                '❌ [OAuth] Error closing window:',
                                e,
                            );
                        }
                    }

                    // Clean up localStorage
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('githubOAuthConnectorId');
                        localStorage.removeItem('githubOAuthSuccess');
                        localStorage.removeItem('githubOAuthShouldReopenModal');
                    }
                }
            } else if (event.data.type === 'GITHUB_OAUTH_ERROR') {
                const connectorId = event.data.connectorId;
                const errorMessage =
                    event.data.error || 'OAuth authorization failed';
                if (
                    connectorId &&
                    connectors.some((c) => c.id === connectorId)
                ) {
                    console.error(
                        '❌ [OAuth] GitHub OAuth failed for connector:',
                        connectorId,
                        errorMessage,
                    );
                    setOauthStatus((prev) => ({
                        ...prev,
                        [connectorId]: 'error',
                    }));
                    setOauthMessages((prev) => ({
                        ...prev,
                        [connectorId]: errorMessage,
                    }));

                    // Close the OAuth window
                    const oauthWindow =
                        oauthWindowsRef.current.get(connectorId);
                    if (oauthWindow && !oauthWindow.closed) {
                        try {
                            oauthWindow.close();
                            oauthWindowsRef.current.delete(connectorId);
                        } catch (e) {
                            console.error(
                                '❌ [OAuth] Error closing window:',
                                e,
                            );
                        }
                    }

                    // Clean up localStorage
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('githubOAuthConnectorId');
                        localStorage.removeItem('githubOAuthSuccess');
                        localStorage.removeItem('githubOAuthError');
                        localStorage.removeItem('githubOAuthShouldReopenModal');
                    }
                }
            } else if (event.data.type === 'CLOSE_OAUTH_WINDOW') {
                // Close request from callback page
                const connectorId = event.data.connectorId;
                const oauthWindow = oauthWindowsRef.current.get(connectorId);
                if (oauthWindow && !oauthWindow.closed) {
                    try {
                        console.log(
                            '🔄 [OAuth] Closing window in response to CLOSE_OAUTH_WINDOW message',
                        );
                        oauthWindow.close();
                        oauthWindowsRef.current.delete(connectorId);
                    } catch (e) {
                        console.error('❌ [OAuth] Error closing window:', e);
                    }
                }
            }
        };

        // Check localStorage for OAuth completion status
        if (typeof window !== 'undefined') {
            const connectorId = localStorage.getItem('githubOAuthConnectorId');
            const oauthSuccess = localStorage.getItem('githubOAuthSuccess');
            const shouldReopenModal = localStorage.getItem(
                'githubOAuthShouldReopenModal',
            );

            if (
                connectorId &&
                shouldReopenModal === 'true' &&
                connectors.some((c) => c.id === connectorId)
            ) {
                if (oauthSuccess === 'true') {
                    console.log(
                        '✅ [OAuth] GitHub OAuth successful for connector:',
                        connectorId,
                    );
                    setOauthStatus((prev) => ({
                        ...prev,
                        [connectorId]: 'success',
                    }));
                    setOauthMessages((prev) => ({
                        ...prev,
                        [connectorId]: 'OAuth configured successfully',
                    }));

                    // Clean up localStorage
                    localStorage.removeItem('githubOAuthConnectorId');
                    localStorage.removeItem('githubOAuthSuccess');
                    localStorage.removeItem('githubOAuthShouldReopenModal');
                } else if (oauthSuccess === 'false') {
                    const errorMessage =
                        localStorage.getItem('githubOAuthError') ||
                        'OAuth authentication failed';
                    console.error(
                        '❌ [OAuth] GitHub OAuth failed for connector:',
                        connectorId,
                        errorMessage,
                    );
                    setOauthStatus((prev) => ({
                        ...prev,
                        [connectorId]: 'error',
                    }));
                    setOauthMessages((prev) => ({
                        ...prev,
                        [connectorId]: errorMessage,
                    }));

                    // Clean up localStorage
                    localStorage.removeItem('githubOAuthConnectorId');
                    localStorage.removeItem('githubOAuthSuccess');
                    localStorage.removeItem('githubOAuthError');
                    localStorage.removeItem('githubOAuthShouldReopenModal');
                }
            }
        }

        // Listen for messages from OAuth callback window
        window.addEventListener('message', handleOAuthMessage);
        return () => {
            window.removeEventListener('message', handleOAuthMessage);
        };
    }, [isOpen, connectors]);

    // Track if modal was previously open to prevent resetting on parent re-renders
    const wasOpenRef = useRef(false);

    // Reset connectors when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            const wasClosed = !wasOpenRef.current;
            wasOpenRef.current = true;

            // Only reset header fields if modal was just opened (transition from closed to open)
            // Don't reset if modal is staying open (user is editing)
            if (wasClosed) {
                // Always start with blank fields when modal opens (no initial values or placeholder text)
                if (fromBuilds) {
                    // When opened from BuildsTable, always start with blank fields
                    setEnvironmentNameState('');
                    setEnvironmentDescription('');
                } else {
                    // When opened from Manage Environments, auto-fill from props
                    setEnvironmentNameState(connectorName || '');
                    setEnvironmentDescription(propEnvironmentDescription || '');
                }

                console.log(
                    '🔍 ConnectorModal opened with initialConnectors:',
                    initialConnectors,
                );
                if (initialConnectors.length > 0) {
                    console.log(
                        '🔌 Loading initial connectors:',
                        initialConnectors,
                    );
                    setConnectors(initialConnectors);
                    setOriginalConnectors(
                        JSON.parse(JSON.stringify(initialConnectors)),
                    ); // Deep copy
                    if (alwaysShowEditForm) {
                        // Mark all connectors as actively editing to show edit form
                        const connectorIds = new Set(
                            initialConnectors.map((c) => c.id),
                        );
                        setActivelyEditingNewConnector(connectorIds);
                        console.log(
                            '🔌 Loaded',
                            initialConnectors.length,
                            'connector(s) with alwaysShowEditForm - showing edit form',
                        );
                    } else {
                        setActivelyEditingNewConnector(new Set());
                        setEditingConnectorId(null); // Clear any editing state to show summary view
                        console.log(
                            '🔌 Loaded',
                            initialConnectors.length,
                            'saved connector(s) - will show summary view if complete',
                        );
                    }
                } else if (connectors.length === 0) {
                    // Only create new connector if we don't have any connectors yet
                    const newId = generateId();
                    const newConnectors = [
                        {
                            id: newId,
                            category: '',
                            connector: '',
                            authenticationType: '',
                            username: '',
                            usernameEncryption: 'Plaintext',
                            apiKey: '',
                            apiKeyEncryption: 'Encrypted', // Default to Encrypted
                            personalAccessToken: '',
                            tokenEncryption: 'Plaintext',
                            status: true, // Default to Active (true)
                            description: '',
                        },
                    ];
                    setConnectors(newConnectors);
                    setOriginalConnectors(
                        JSON.parse(JSON.stringify(newConnectors)),
                    ); // Deep copy
                    // Mark this new connector as actively being edited
                    setActivelyEditingNewConnector(new Set([newId]));
                } else {
                    // Modal staying open with existing connectors - preserve them
                    console.log(
                        '🔍 ConnectorModal staying open - preserving existing connectors:',
                        connectors.length,
                    );
                }
                setHasUnsavedChanges(false);

                // Don't reset OAuth status when modal opens - preserve pending and success statuses
                // This allows "OAuth in Progress" to persist until authorization completes
                // Also check localStorage for any active OAuth flows
                setOauthStatus((prev) => {
                    const preserved: {
                        [connectorId: string]:
                            | 'idle'
                            | 'pending'
                            | 'success'
                            | 'error';
                    } = {};

                    // First, preserve existing pending/success statuses
                    Object.keys(prev).forEach((connectorId) => {
                        if (
                            prev[connectorId] === 'pending' ||
                            prev[connectorId] === 'success'
                        ) {
                            preserved[connectorId] = prev[connectorId];
                        }
                    });

                    // Also check localStorage for active OAuth flows
                    if (typeof window !== 'undefined') {
                        const storedConnectorId = localStorage.getItem(
                            'githubOAuthConnectorId',
                        );
                        const oauthSuccess =
                            localStorage.getItem('githubOAuthSuccess');

                        if (
                            storedConnectorId &&
                            connectors.some((c) => c.id === storedConnectorId)
                        ) {
                            if (oauthSuccess === 'true') {
                                preserved[storedConnectorId] = 'success';
                            } else if (oauthSuccess !== 'false') {
                                // If there's a connector ID but no success/error yet, it's pending
                                preserved[storedConnectorId] = 'pending';
                            }
                        }
                    }

                    // Update ref with preserved statuses
                    oauthStatusRef.current = preserved;
                    return preserved;
                });
                // Preserve messages for pending/success statuses
                setOauthMessages((prevMessages) => {
                    const preserved: {[connectorId: string]: string} = {};
                    Object.keys(prevMessages).forEach((connectorId) => {
                        const status = oauthStatusRef.current[connectorId];
                        if (status === 'pending' || status === 'success') {
                            preserved[connectorId] = prevMessages[connectorId];
                        }
                    });
                    // Set default messages for pending statuses found in localStorage
                    Object.keys(oauthStatusRef.current).forEach(
                        (connectorId) => {
                            if (
                                oauthStatusRef.current[connectorId] ===
                                    'pending' &&
                                !preserved[connectorId]
                            ) {
                                preserved[connectorId] = 'OAuth in Progress';
                            } else if (
                                oauthStatusRef.current[connectorId] ===
                                    'success' &&
                                !preserved[connectorId]
                            ) {
                                preserved[connectorId] =
                                    'OAuth configured successfully';
                            }
                        },
                    );
                    return preserved;
                });
            } else {
                // Modal is staying open - but check if initialConnectors changed (new row selected)
                // If initialConnectors has data and we don't have connectors, load them
                if (initialConnectors.length > 0 && connectors.length === 0) {
                    console.log(
                        '🔌 Loading initial connectors while staying open:',
                        initialConnectors,
                    );
                    setConnectors(initialConnectors);
                    setOriginalConnectors(
                        JSON.parse(JSON.stringify(initialConnectors)),
                    ); // Deep copy
                    setActivelyEditingNewConnector(new Set());
                    setEditingConnectorId(null);
                } else {
                    // Modal is staying open - preserve state, don't reset
                    console.log(
                        '🔍 ConnectorModal staying open - preserving state',
                    );
                }
            }
        } else {
            // Modal closed - reset flag
            wasOpenRef.current = false;
            console.log('🔍 ConnectorModal closed - reset wasOpenRef');
        }
    }, [isOpen, initialConnectors, connectors, connectorName]);

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen && originalConnectors.length > 0) {
            const hasChanges =
                JSON.stringify(connectors) !==
                JSON.stringify(originalConnectors);
            setHasUnsavedChanges(hasChanges);
        }
    }, [connectors, originalConnectors, isOpen]);

    // After state updates, check if all connectors are saved and clear hasUnsavedChanges
    useEffect(() => {
        if (!isOpen) return;

        const allComplete = connectors.every((c) => isConnectorComplete(c));
        const allSaved = connectors.every(
            (c) =>
                isConnectorComplete(c) &&
                !activelyEditingNewConnector.has(c.id) &&
                editingConnectorId !== c.id,
        );

        if (allComplete && allSaved && connectors.length > 0) {
            setHasUnsavedChanges(false);
        }
    }, [connectors, activelyEditingNewConnector, editingConnectorId, isOpen]);

    // Load GitHub OAuth Client ID from API
    useEffect(() => {
        if (!isOpen) return;

        const loadGitHubOAuthClientId = async () => {
            setLoadingOAuthClientId(true);
            try {
                // Get account, enterprise, and workstream (entity) from props or localStorage
                const accountId =
                    selectedAccountId ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedAccountId')
                        : null);
                const accountName =
                    selectedAccountName ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedAccountName')
                        : null);
                const enterpriseId =
                    selectedEnterpriseId ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedEnterpriseId')
                        : null);
                const enterpriseName =
                    selectedEnterprise ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedEnterpriseName')
                        : null);

                // Build API URL with query parameters
                let apiUrl = '/api/oauth/github/client-id';
                const params = new URLSearchParams();
                if (accountId) params.append('accountId', accountId);
                if (accountName) params.append('accountName', accountName);
                if (enterpriseId) params.append('enterpriseId', enterpriseId);
                if (enterpriseName)
                    params.append('enterpriseName', enterpriseName);
                if (workstream) params.append('workstream', workstream);
                if (params.toString()) apiUrl += `?${params.toString()}`;

                console.log(
                    '🔑 [OAuth] Fetching GitHub OAuth Client ID from:',
                    apiUrl,
                );

                try {
                    const response = await api.get<
                        {clientId: string} | {error: string} | any
                    >(apiUrl);

                    console.log('📥 [OAuth] API Response:', response);
                    console.log('📥 [OAuth] Response type:', typeof response);
                    console.log(
                        '📥 [OAuth] Response keys:',
                        response ? Object.keys(response) : 'null',
                    );

                    // Handle different response formats
                    if (response && typeof response === 'object') {
                        // Check if response has clientId property
                        if ('clientId' in response && response.clientId) {
                            console.log(
                                '✅ [OAuth] GitHub OAuth Client ID loaded successfully:',
                                response.clientId.substring(0, 10) + '...',
                            );
                            setGithubOAuthClientId(response.clientId);
                            return;
                        }
                        // Check if response has client_id (snake_case)
                        if ('client_id' in response && response.client_id) {
                            console.log(
                                '✅ [OAuth] GitHub OAuth Client ID loaded successfully (snake_case):',
                                response.client_id.substring(0, 10) + '...',
                            );
                            setGithubOAuthClientId(response.client_id);
                            return;
                        }
                        // Check if response is a string (direct client ID)
                        if (
                            typeof response === 'string' &&
                            response.trim() !== ''
                        ) {
                            console.log(
                                '✅ [OAuth] GitHub OAuth Client ID loaded successfully (string):',
                                response.substring(0, 10) + '...',
                            );
                            setGithubOAuthClientId(response);
                            return;
                        }
                    }

                    console.warn(
                        '⚠️ [OAuth] GitHub OAuth Client ID not found in response:',
                        response,
                    );
                    setGithubOAuthClientId(null);
                } catch (apiError: any) {
                    // Check if it's a 404 (endpoint doesn't exist)
                    if (
                        apiError?.message?.includes('404') ||
                        apiError?.message?.includes('Not Found')
                    ) {
                        console.error(
                            '❌ [OAuth] API endpoint not found. Backend endpoint /api/oauth/github/client-id needs to be implemented.',
                        );
                        console.error(
                            '📝 [OAuth] Please implement GET /api/oauth/github/client-id endpoint in your backend.',
                        );
                    } else {
                        console.error(
                            '❌ [OAuth] Failed to load GitHub OAuth Client ID:',
                            apiError,
                        );
                    }
                    setGithubOAuthClientId(null);
                }
            } catch (error: any) {
                console.error(
                    '❌ [OAuth] Unexpected error loading GitHub OAuth Client ID:',
                    error,
                );
                console.error('❌ [OAuth] Error details:', {
                    message: error?.message,
                    stack: error?.stack,
                });
                setGithubOAuthClientId(null);
            } finally {
                setLoadingOAuthClientId(false);
            }
        };

        loadGitHubOAuthClientId();
    }, [
        isOpen,
        selectedAccountId,
        selectedAccountName,
        selectedEnterpriseId,
        selectedEnterprise,
        workstream,
    ]);

    // Load Global Settings data when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const loadGlobalSettingsData = async () => {
            setLoadingGlobalSettings(true);
            try {
                // Get account, enterprise, and workstream (entity) from props or localStorage
                const accountId =
                    selectedAccountId ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedAccountId')
                        : null);
                const accountName =
                    selectedAccountName ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedAccountName')
                        : null);
                const enterpriseId =
                    selectedEnterpriseId ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedEnterpriseId')
                        : null);
                const enterpriseName =
                    selectedEnterprise ||
                    (typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedEnterpriseName')
                        : null);

                if (
                    !accountId ||
                    !accountName ||
                    !enterpriseId ||
                    !workstream
                ) {
                    console.log(
                        '⚠️ [ConnectorModal] Missing required context for loading global settings:',
                        {
                            accountId: !!accountId,
                            accountName: !!accountName,
                            enterpriseId: !!enterpriseId,
                            workstream: !!workstream,
                        },
                    );
                    setGlobalSettingsData({});
                    setAvailableCategories([]);
                    setLoadingGlobalSettings(false);
                    return;
                }

                console.log(
                    '📡 [ConnectorModal] Loading global settings for:',
                    {
                        accountId,
                        accountName,
                        enterpriseId,
                        enterpriseName,
                        workstream,
                    },
                );

                // Fetch global settings data filtered by account, enterprise, and entity (workstream)
                const response =
                    (await api.get<
                        Array<{
                            id?: string;
                            entityName?: string;
                            accountId?: string;
                            accountName?: string;
                            enterpriseId?: string;
                            enterpriseName?: string;
                            configurationDetails?: Record<string, string[]>;
                            categories?: Record<string, string[]>;
                            configuration?: Record<string, string[]> | string;
                        }>
                    >(
                        `/api/global-settings?accountId=${accountId}&accountName=${encodeURIComponent(
                            accountName,
                        )}&enterpriseId=${enterpriseId}`,
                    )) || [];

                console.log(
                    '📦 [ConnectorModal] Global settings API response:',
                    response,
                );

                // Find the setting that matches the workstream (entity)
                console.log(
                    '🔍 [ConnectorModal] Searching for workstream:',
                    workstream,
                );
                console.log(
                    '🔍 [ConnectorModal] Available entities in response:',
                    response.map((s: any) => s.entityName || s.entity),
                );

                const entitySetting = response.find((setting: any) => {
                    const settingEntityName =
                        setting.entityName || setting.entity || '';
                    const matches =
                        settingEntityName.toLowerCase().trim() ===
                        workstream.toLowerCase().trim();
                    if (matches) {
                        console.log(
                            '✅ [ConnectorModal] Found matching entity:',
                            settingEntityName,
                        );
                    }
                    return matches;
                });

                if (entitySetting) {
                    // Extract configurationDetails (category -> tools mapping)
                    const configDetails =
                        entitySetting.configurationDetails ||
                        entitySetting.categories ||
                        (typeof entitySetting.configuration === 'object' &&
                        entitySetting.configuration !== null
                            ? entitySetting.configuration
                            : {});

                    console.log(
                        '📦 [ConnectorModal] Found entity setting configuration:',
                        configDetails,
                    );
                    console.log(
                        '📦 [ConnectorModal] Configuration keys (categories):',
                        Object.keys(configDetails),
                    );

                    // Set global settings data
                    setGlobalSettingsData(configDetails);

                    // Extract available categories (only categories that have tools)
                    // Order categories using CATEGORY_ORDER to match Global Settings modal
                    const allCategories = Object.keys(configDetails).filter(
                        (category) => {
                            const tools = configDetails[category];
                            const hasTools =
                                Array.isArray(tools) && tools.length > 0;
                            if (hasTools) {
                                console.log(
                                    `  ✅ Category "${category}" has ${tools.length} tools:`,
                                    tools,
                                );
                            }
                            return hasTools;
                        },
                    );

                    // Sort categories according to CATEGORY_ORDER, then add any others at the end
                    const orderedCategories = [
                        ...CATEGORY_ORDER.filter((cat) =>
                            allCategories.includes(cat),
                        ),
                        ...allCategories.filter(
                            (cat) => !CATEGORY_ORDER.includes(cat as any),
                        ),
                    ];

                    setAvailableCategories(orderedCategories);
                    console.log(
                        '✅ [ConnectorModal] Loaded categories (ordered):',
                        orderedCategories,
                    );
                } else {
                    console.log(
                        '⚠️ [ConnectorModal] No global settings found for workstream:',
                        workstream,
                    );
                    console.log(
                        '⚠️ [ConnectorModal] Available entities:',
                        response.map((s: any) => ({
                            entityName: s.entityName || s.entity,
                            accountId: s.accountId,
                            enterpriseId: s.enterpriseId,
                        })),
                    );
                    setGlobalSettingsData({});
                    setAvailableCategories([]);
                }
            } catch (error) {
                console.error(
                    '❌ [ConnectorModal] Failed to load global settings:',
                    error,
                );
                setGlobalSettingsData({});
                setAvailableCategories([]);
            } finally {
                setLoadingGlobalSettings(false);
            }
        };

        loadGlobalSettingsData();
    }, [
        isOpen,
        selectedAccountId,
        selectedAccountName,
        selectedEnterpriseId,
        selectedEnterprise,
        workstream,
    ]);

    // Helper function to get tools for a category
    const getToolsForCategory = useCallback(
        (category: string): string[] => {
            if (!category || !globalSettingsData[category]) {
                return [];
            }
            return globalSettingsData[category] || [];
        },
        [globalSettingsData],
    );

    // Define tool order for each category (matching Global Settings modal)
    const TOOL_ORDER_BY_CATEGORY: Record<string, string[]> = {
        plan: ['Jira', 'Azure DevOps', 'Trello', 'Asana', 'Other'],
        code: [
            'GitHub',
            'GitLab',
            'Azure Repos',
            'Bitbucket',
            'SonarQube',
            'Other',
        ],
        build: [
            'Jenkins',
            'GitHub Actions',
            'CircleCI',
            'AWS CodeBuild',
            'Google Cloud Build',
            'Azure DevOps',
            'Other',
        ],
        test: ['Cypress', 'Selenium', 'Jest', 'Tricentis Tosca', 'Other'],
        release: ['Argo CD', 'ServiceNow', 'Azure DevOps', 'Other'],
        deploy: [
            'Kubernetes',
            'Helm',
            'Terraform',
            'Ansible',
            'Docker',
            'AWS CodePipeline',
            'Cloud Foundry',
            'Other',
        ],
        others: ['Prometheus', 'Grafana', 'Slack', 'Other'],
    };

    // Define authentication types available for each connector
    const AUTH_TYPES_BY_CONNECTOR: Record<string, string[]> = {
        Jira: ['Username and API Key', 'Personal Access Token'],
        GitHub: ['Username and Token', 'GitHub App', 'OAuth'],
        // Add more connectors as needed
    };

    // Helper function to get authentication types for a connector
    const getAuthTypesForConnector = useCallback(
        (connectorName: string): string[] => {
            if (!connectorName) return [];
            return AUTH_TYPES_BY_CONNECTOR[connectorName] || [];
        },
        [],
    );

    // Helper function to get ordered tools for a category
    const getOrderedToolsForCategory = useCallback(
        (category: string): string[] => {
            const tools = getToolsForCategory(category);
            if (tools.length === 0) return [];

            // Get the order for this category
            const order = TOOL_ORDER_BY_CATEGORY[category] || [];

            // Sort tools according to the order, then add any remaining tools at the end
            const ordered = [
                ...order.filter((tool) => tools.includes(tool)),
                ...tools.filter((tool) => !order.includes(tool)),
            ];

            return ordered;
        },
        [getToolsForCategory],
    );

    const addNewConnector = () => {
        const newId = generateId();
        setConnectors((prev) => [
            ...prev,
            {
                id: newId,
                category: FIXED_CATEGORY_VALUE,
                connector: FIXED_CONNECTOR_VALUE,
                connectorIconName: getToolConfig(FIXED_CONNECTOR_VALUE)
                    ?.iconName,
                environmentType: undefined,
                apiUrl: '',
                apiCredentialName: '',
                iflowUrl: '',
                iflowCredentialName: '',
                hostUrl: '',
                authenticationType: '',
                username: '',
                usernameEncryption: 'Plaintext',
                apiKey: '',
                apiKeyEncryption: 'Encrypted', // Default to Encrypted
                personalAccessToken: '',
                tokenEncryption: 'Plaintext',
                status: true, // Default to Active (true)
                description: '',
            },
        ]);
        // Mark this new connector as actively being edited
        setActivelyEditingNewConnector((prev) => {
            const newSet = new Set(prev);
            newSet.add(newId);
            return newSet;
        });
    };

    const updateConnector = useCallback(
        (
            id: string,
            field: keyof Omit<Connector, 'id'>,
            value: string | boolean,
        ) => {
            console.log('Updating connector:', {id, field, value});

            // Mark this connector as actively being edited if it wasn't already
            setActivelyEditingNewConnector((prev) => {
                const newSet = new Set(prev);
                newSet.add(id);
                return newSet;
            });

            // Clear validation errors and messages for this field when user starts typing
            setValidationErrors((prev) => {
                const newErrors = {...prev};
                if (newErrors[id]) {
                    newErrors[id] = newErrors[id].filter(
                        (error) => error !== field,
                    );
                    if (newErrors[id].length === 0) {
                        delete newErrors[id];
                    }
                }
                return newErrors;
            });

            setValidationMessages((prev) => {
                const newMessages = {...prev};
                if (newMessages[id]) {
                    const fieldMessages = {...newMessages[id]};
                    delete fieldMessages[field as string];
                    if (Object.keys(fieldMessages).length === 0) {
                        delete newMessages[id];
                    } else {
                        newMessages[id] = fieldMessages;
                    }
                }
                return newMessages;
            });

            setConnectors((prev) => {
                const updated = prev.map((connector) => {
                    if (connector.id === id) {
                        const updatedConnector = {...connector, [field]: value};
                        // If connector field is being updated, also update the icon name
                        if (
                            field === 'connector' &&
                            typeof value === 'string'
                        ) {
                            const toolConfig = getToolConfig(value);
                            updatedConnector.connectorIconName =
                                toolConfig?.iconName || undefined;
                        }
                        return updatedConnector;
                    }
                    return connector;
                });
                console.log('Updated connectors:', updated);
                return updated;
            });
        },
        [],
    );

    // Clear API/IFlow credential name if it no longer exists in Manage Credentials for the current context
    const validateAndCleanEnvironmentCredentialNames = useCallback(() => {
        if (!isOpen) return;

        // Need account/enterprise to read credentials storage
        if (!selectedAccountId || !selectedEnterpriseId) return;

        try {
            const LOCAL_STORAGE_CREDENTIALS_KEY =
                'credentials_credentials_data';
            const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
            const stored =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem(storageKey)
                    : null;
            const allCredentials: CredentialRow[] = stored
                ? JSON.parse(stored)
                : [];

            const credentialExistsFor = (
                credentialNameRaw: string,
                serviceKeyDetails: 'API' | 'IFlow',
            ): boolean => {
                const credentialName = (credentialNameRaw || '').trim();
                if (!credentialName) return true;

                const row = allCredentials.find((c) => {
                    const nameMatch =
                        (c.credentialName || '').trim() === credentialName;
                    const entityMatch =
                        !workstream ||
                        !c.entity ||
                        c.entity.toLowerCase() ===
                            String(workstream).toLowerCase();
                    const productMatch =
                        !product ||
                        !c.product ||
                        c.product.toLowerCase() ===
                            String(product).toLowerCase();
                    const serviceMatch =
                        !service ||
                        !c.service ||
                        c.service.toLowerCase() ===
                            String(service).toLowerCase();
                    return (
                        nameMatch && entityMatch && productMatch && serviceMatch
                    );
                });

                if (!row) return false;

                const cfConfig = row.connectors?.some((cfg) => {
                    const matchesCategory =
                        (cfg.category || '').toLowerCase() === 'deploy';
                    const matchesConnector =
                        (cfg.connector || '').toLowerCase() === 'cloud foundry';
                    const matchesServiceKey =
                        !cfg.serviceKeyDetails ||
                        String(cfg.serviceKeyDetails).toLowerCase() ===
                            String(serviceKeyDetails).toLowerCase();
                    return (
                        matchesCategory && matchesConnector && matchesServiceKey
                    );
                });

                return !!cfConfig;
            };

            setConnectors((prev) =>
                prev.map((c) => {
                    let next = c;
                    if (
                        c.apiCredentialName?.trim() &&
                        !credentialExistsFor(c.apiCredentialName, 'API')
                    ) {
                        next = {...next, apiCredentialName: ''};
                    }
                    if (
                        c.iflowCredentialName?.trim() &&
                        !credentialExistsFor(c.iflowCredentialName, 'IFlow')
                    ) {
                        next = {...next, iflowCredentialName: ''};
                    }
                    return next;
                }),
            );
        } catch (e) {
            console.error(
                '❌ [EnvironmentModal] Error validating credential names:',
                e,
            );
        }
    }, [
        isOpen,
        selectedAccountId,
        selectedEnterpriseId,
        workstream,
        product,
        service,
    ]);

    // Re-validate selected credential names when Manage Credentials changes (e.g., delete/edit)
    useEffect(() => {
        if (!isOpen) return;
        const handleCredentialsChanged = () =>
            validateAndCleanEnvironmentCredentialNames();
        window.addEventListener(
            'credentialsStorageChanged',
            handleCredentialsChanged as EventListener,
        );
        return () => {
            window.removeEventListener(
                'credentialsStorageChanged',
                handleCredentialsChanged as EventListener,
            );
        };
    }, [isOpen, validateAndCleanEnvironmentCredentialNames]);

    // Also validate when modal opens or context changes
    useEffect(() => {
        validateAndCleanEnvironmentCredentialNames();
    }, [validateAndCleanEnvironmentCredentialNames]);

    const removeConnector = (id: string) => {
        if (connectors.length > 1) {
            setConnectors((prev) =>
                prev.filter((connector) => connector.id !== id),
            );
        }
    };

    const handleSave = () => {
        if (!validateAllConnectors()) {
            return; // Don't save if validation fails
        }

        const validConnectors = connectors.filter(
            (connector) =>
                connector.category.trim() || connector.connector.trim(),
        );

        if (onSave) {
            onSave(validConnectors);
        }
        setHasUnsavedChanges(false);
        setValidationErrors({}); // Clear validation errors on successful save
        setValidationMessages({}); // Clear validation messages on successful save
        onClose();
    };

    const handleSaveIndividualConnector = (connector: Connector) => {
        console.log(
            '💾 [EnvironmentModal] Save button clicked - handleSaveIndividualConnector called',
        );
        console.log(
            '💾 [EnvironmentModal] Environment Name from header:',
            environmentNameState,
        );
        console.log(
            '💾 [EnvironmentModal] Description from header:',
            environmentDescription,
        );

        // Validate Environment Name (mandatory)
        if (!environmentNameState || !environmentNameState.trim()) {
            console.error(
                '❌ [EnvironmentModal] Validation failed: Environment Name is required',
            );
            alert('Environment Name is required');
            return;
        }

        // Get the latest connector from state to ensure we have the most up-to-date values
        const currentConnector =
            connectors.find((c) => c.id === connector.id) || connector;
        const connectorToSave = {...currentConnector};

        // Update description from header field
        connectorToSave.description = environmentDescription;
        console.log(
            '💾 [EnvironmentModal] Updated connector description:',
            environmentDescription,
        );

        const connectorValidation = validateConnector(connectorToSave);
        if (connectorValidation.errors.length > 0) {
            // Update validation errors to show the errors for this connector
            setValidationErrors((prevErrors) => ({
                ...prevErrors,
                [connectorToSave.id]: connectorValidation.errors,
            }));
            setValidationMessages((prevMessages) => ({
                ...prevMessages,
                [connectorToSave.id]: connectorValidation.messages,
            }));
            return; // Don't proceed if there are validation errors
        }

        // Clear any existing validation errors for this connector
        setValidationErrors((prevErrors) => {
            const newErrors = {...prevErrors};
            delete newErrors[connectorToSave.id];
            return newErrors;
        });

        setValidationMessages((prevMessages) => {
            const newMessages = {...prevMessages};
            delete newMessages[connectorToSave.id];
            return newMessages;
        });

        // Update the connector in the current state
        const updatedConnectors = connectors.map((c) =>
            c.id === connectorToSave.id ? connectorToSave : c,
        );
        setConnectors(updatedConnectors);

        // Remove from actively editing when connector saves - this triggers summary view
        setActivelyEditingNewConnector((prev) => {
            const newSet = new Set(prev);
            newSet.delete(connectorToSave.id);
            console.log(
                '💾 [ConnectorModal] Removed from activelyEditingNewConnector:',
                connectorToSave.id,
                'Remaining:',
                Array.from(newSet),
            );
            return newSet;
        });

        // Also clear the editingConnectorId if this connector was being edited
        if (editingConnectorId === connectorToSave.id) {
            console.log(
                '💾 [ConnectorModal] Clearing editingConnectorId:',
                connectorToSave.id,
            );
            setEditingConnectorId(null);
        }

        console.log('💾 [ConnectorModal] After save - connector state:', {
            id: connectorToSave.id,
            category: connectorToSave.category,
            connector: connectorToSave.connector,
            isComplete: isConnectorComplete(connectorToSave),
            currentlyActivelyEditing: activelyEditingNewConnector.has(
                connectorToSave.id,
            ),
            currentlyExplicitlyEditing:
                editingConnectorId === connectorToSave.id,
        });

        // Update originalConnectors to reflect that this connector is now saved
        setOriginalConnectors((prev) => {
            const updatedOriginal = [...prev];
            const existingIndex = updatedOriginal.findIndex(
                (c) => c.id === connectorToSave.id,
            );
            if (existingIndex >= 0) {
                updatedOriginal[existingIndex] = {...connectorToSave};
            } else {
                updatedOriginal.push({...connectorToSave});
            }
            return updatedOriginal;
        });

        // Save individual connector to database immediately - use setTimeout to avoid updating parent during render
        if (onSaveIndividual) {
            const validConnectors = updatedConnectors.filter(
                (c) => c.category.trim() || c.connector.trim(),
            );
            // Defer the call to avoid updating parent during render
            // Pass environmentNameState and environmentDescription along with connectors
            setTimeout(() => {
                console.log(
                    '💾 [EnvironmentModal] Calling onSaveIndividual with environment name:',
                    environmentNameState.trim(),
                );
                onSaveIndividual(
                    validConnectors,
                    environmentNameState.trim(),
                    environmentDescription.trim(),
                );
            }, 0);
        }
    };

    const handleClose = () => {
        // Check if any connector is actively being edited (incomplete or explicitly editing)
        const hasActiveEditing = connectors.some(
            (c) =>
                activelyEditingNewConnector.has(c.id) ||
                editingConnectorId === c.id ||
                !isConnectorComplete(c),
        );

        if (hasUnsavedChanges || hasActiveEditing) {
            setShowUnsavedChangesDialog(true);
        } else {
            // All connectors are saved and showing summary view - allow closing
            // Save current connectors before closing (includes individually saved connectors)
            const validConnectors = connectors.filter(
                (connector) =>
                    connector.category.trim() || connector.connector.trim(),
            );
            if (onSave) {
                onSave(validConnectors);
            }
            onClose();
        }
    };

    const handleDiscardChanges = () => {
        // Even when discarding changes, save any individually saved connectors
        const validConnectors = originalConnectors.filter(
            (connector) =>
                connector.category.trim() || connector.connector.trim(),
        );
        if (onSave) {
            onSave(validConnectors);
        }
        setHasUnsavedChanges(false);
        setShowUnsavedChangesDialog(false);
        onClose();
    };

    const handleKeepEditing = () => {
        setShowUnsavedChangesDialog(false);
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-[9999] overflow-hidden'>
            {/* Backdrop */}
            <div
                className='absolute inset-0 bg-black bg-opacity-50'
                onClick={handleClose}
            />

            {/* Modal Panel */}
            <motion.div
                className='absolute right-0 top-0 h-screen w-[500px] shadow-2xl border-l border-gray-200 flex overflow-hidden'
                initial={{x: '100%'}}
                animate={{x: 0}}
                exit={{x: '100%'}}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Panel - Sidebar Image */}
                <div className='w-10 bg-slate-800 text-white flex flex-col relative h-screen'>
                    <img
                        src='/images/logos/sidebar.png'
                        alt='Sidebar'
                        className='w-full h-full object-cover'
                    />

                    {/* Middle Text - Rotated and Bold */}
                    <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10'>
                        <div className='flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide'>
                            <Plug className='h-4 w-4' />
                            <span>Manage Environments</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className='flex-1 flex flex-col bg-white'>
                    {/* Header */}
                    <div className='bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-blue-100 text-base'>
                                    Configure Environment
                                </p>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <button
                                    onClick={handleClose}
                                    className='p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg'
                                >
                                    <X className='h-5 w-5' />
                                </button>
                            </div>
                        </div>

                        {/* Environment Info */}
                        <div className='mt-4 grid grid-cols-2 gap-4'>
                            <div>
                                <div className='text-blue-100 text-sm font-medium mb-1'>
                                    Environment Name{fromBuilds ? ' *' : ''}
                                </div>
                                <input
                                    type='text'
                                    value={environmentNameState}
                                    onChange={(e) =>
                                        setEnvironmentNameState(e.target.value)
                                    }
                                    className='w-full px-2 py-1 border border-white/20 rounded-lg text-sm bg-white/10 backdrop-blur-sm text-white min-h-[28px] focus:outline-none focus:ring-2 focus:ring-white/30'
                                />
                            </div>
                            <div>
                                <div className='text-blue-100 text-sm font-medium mb-1'>
                                    Description
                                </div>
                                <input
                                    type='text'
                                    value={environmentDescription}
                                    onChange={(e) =>
                                        setEnvironmentDescription(
                                            e.target.value,
                                        )
                                    }
                                    className='w-full px-2 py-1 border border-white/20 rounded-lg text-sm bg-white/10 backdrop-blur-sm text-white min-h-[28px] focus:outline-none focus:ring-2 focus:ring-white/30'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Area - Fixed height and proper overflow */}
                    <div className='flex-1 bg-gray-50 overflow-hidden'>
                        <div className='h-full overflow-y-auto px-6 py-6'>
                            <div className='space-y-6'>
                                {/* Environment Cards */}
                                {connectors.map((connector, index) => (
                                    <div
                                        key={connector.id}
                                        className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'
                                    >
                                        <div className='flex items-center justify-between mb-4'>
                                            <div className='flex items-center space-x-3'>
                                                <div className='p-2 bg-blue-100 rounded-lg'>
                                                    <Plug className='h-4 w-4 text-blue-600' />
                                                </div>
                                                <h3 className='text-base font-semibold text-gray-900'>
                                                    Environment
                                                </h3>
                                            </div>
                                            <div className='flex items-center space-x-2'>
                                                {/* Show Save button when actively editing (either incomplete connector or explicitly editing) */}
                                                {(activelyEditingNewConnector.has(
                                                    connector.id,
                                                ) ||
                                                    editingConnectorId ===
                                                        connector.id ||
                                                    !isConnectorComplete(
                                                        connector,
                                                    )) && (
                                                    <button
                                                        onClick={() =>
                                                            handleSaveIndividualConnector(
                                                                connector,
                                                            )
                                                        }
                                                        className='flex items-center space-x-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 ring-2 ring-blue-300 ring-opacity-50'
                                                    >
                                                        <BookmarkIcon className='h-4 w-4' />
                                                        <span>Save</span>
                                                    </button>
                                                )}
                                                {isConnectorComplete(
                                                    connector,
                                                ) &&
                                                    !activelyEditingNewConnector.has(
                                                        connector.id,
                                                    ) &&
                                                    editingConnectorId !==
                                                        connector.id && (
                                                        <button
                                                            onClick={() => {
                                                                if (
                                                                    editingConnectorId ===
                                                                    connector.id
                                                                ) {
                                                                    setEditingConnectorId(
                                                                        null,
                                                                    );
                                                                } else {
                                                                    setEditingConnectorId(
                                                                        connector.id,
                                                                    );
                                                                    // Add back to actively editing when clicking Edit from summary
                                                                    setActivelyEditingNewConnector(
                                                                        (
                                                                            prev,
                                                                        ) => {
                                                                            const newSet =
                                                                                new Set(
                                                                                    prev,
                                                                                );
                                                                            newSet.add(
                                                                                connector.id,
                                                                            );
                                                                            return newSet;
                                                                        },
                                                                    );
                                                                }
                                                            }}
                                                            className='flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
                                                        >
                                                            <Edit2 className='h-3 w-3' />
                                                            <span>
                                                                {editingConnectorId ===
                                                                connector.id
                                                                    ? 'Cancel'
                                                                    : 'Edit'}
                                                            </span>
                                                        </button>
                                                    )}
                                                {connectors.length > 1 && (
                                                    <button
                                                        onClick={() =>
                                                            removeConnector(
                                                                connector.id,
                                                            )
                                                        }
                                                        className='text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors'
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Connector Form Fields - Always show for incomplete connectors, actively editing connectors, or when explicitly editing */}
                                        {(() => {
                                            const isComplete =
                                                isConnectorComplete(connector);
                                            const isActivelyEditing =
                                                activelyEditingNewConnector.has(
                                                    connector.id,
                                                );
                                            const isExplicitlyEditing =
                                                editingConnectorId ===
                                                connector.id;
                                            const showEditForm =
                                                !isComplete ||
                                                isActivelyEditing ||
                                                isExplicitlyEditing;

                                            // Debug logging
                                            if (isComplete && !showEditForm) {
                                                console.log(
                                                    '📋 [ConnectorModal] Showing summary view for connector:',
                                                    connector.id,
                                                    {
                                                        isComplete,
                                                        isActivelyEditing,
                                                        isExplicitlyEditing,
                                                        connectorCategory:
                                                            connector.category,
                                                        connectorName:
                                                            connector.connector,
                                                    },
                                                );
                                            }

                                            return showEditForm;
                                        })() ? (
                                            <div className='space-y-4'>
                                                <div className='grid grid-cols-2 gap-4'>
                                                    <div>
                                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                            Category *
                                                        </label>
                                                        <input
                                                            type='text'
                                                            value={
                                                                FIXED_CATEGORY_LABEL
                                                            }
                                                            disabled
                                                            className='w-full px-2 py-1 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[28px]'
                                                        />
                                                        {validationErrors[
                                                            connector.id
                                                        ]?.includes(
                                                            'category',
                                                        ) && (
                                                            <p className='text-red-500 text-xs mt-1'>
                                                                {validationMessages[
                                                                    connector.id
                                                                ]?.category ||
                                                                    'Category is required'}
                                                            </p>
                                                        )}
                                                        {loadingGlobalSettings && (
                                                            <p className='text-gray-500 text-xs mt-1'>
                                                                Loading
                                                                categories...
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                            Connector *
                                                        </label>
                                                        <div className='flex items-center gap-2 px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 min-h-[28px]'>
                                                            {connector.connectorIconName ? (
                                                                <Icon
                                                                    name={
                                                                        connector.connectorIconName
                                                                    }
                                                                    size={16}
                                                                    className='text-slate-600'
                                                                />
                                                            ) : (
                                                                <Plug className='w-4 h-4 text-slate-600' />
                                                            )}
                                                            <input
                                                                type='text'
                                                                value={
                                                                    FIXED_CONNECTOR_VALUE
                                                                }
                                                                disabled
                                                                className='w-full bg-transparent text-sm text-slate-700 outline-none'
                                                            />
                                                        </div>
                                                        {validationErrors[
                                                            connector.id
                                                        ]?.includes(
                                                            'connector',
                                                        ) && (
                                                            <p className='text-red-500 text-xs mt-1'>
                                                                {validationMessages[
                                                                    connector.id
                                                                ]?.connector ||
                                                                    'Connector is required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Connectivity Details Section */}
                                                <div className='border-t border-gray-200 pt-4 mt-4'>
                                                    <h3 className='text-base font-semibold text-gray-900 mb-4'>
                                                        Connectivity Details
                                                    </h3>
                                                    <div className='space-y-4'>
                                                        {/* Environment Type tiles (Pre-Production / Production) */}
                                                        <div>
                                                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                Environment Type
                                                                *
                                                            </label>
                                                            <div className='grid grid-cols-2 gap-3'>
                                                                {(
                                                                    [
                                                                        'Pre-Production',
                                                                        'Production',
                                                                    ] as const
                                                                ).map((opt) => {
                                                                    const selected =
                                                                        connector.environmentType ===
                                                                        opt;
                                                                    return (
                                                                        <button
                                                                            key={
                                                                                opt
                                                                            }
                                                                            type='button'
                                                                            onClick={() =>
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'environmentType',
                                                                                    opt,
                                                                                )
                                                                            }
                                                                            className={`relative text-left rounded-lg border p-3 transition-colors ${
                                                                                selected
                                                                                    ? 'border-blue-500 bg-blue-50'
                                                                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                                                            }`}
                                                                        >
                                                                            {selected && (
                                                                                <div className='absolute top-2 right-2 w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center'>
                                                                                    <Check className='w-3.5 h-3.5 text-white' />
                                                                                </div>
                                                                            )}
                                                                            <div className='text-sm font-semibold text-slate-800'>
                                                                                {
                                                                                    opt
                                                                                }
                                                                            </div>
                                                                            <div className='text-xs text-slate-500 mt-0.5'>
                                                                                {opt ===
                                                                                'Pre-Production'
                                                                                    ? 'Non-prod / staging target'
                                                                                    : 'Production target'}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {validationErrors[
                                                                connector.id
                                                            ]?.includes(
                                                                'environmentType',
                                                            ) && (
                                                                <p className='text-red-500 text-xs mt-1'>
                                                                    {validationMessages[
                                                                        connector
                                                                            .id
                                                                    ]
                                                                        ?.environmentType ||
                                                                        'Environment Type is required'}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Cloud Foundry Connectivity Fields */}
                                                        <div className='space-y-4'>
                                                            <div>
                                                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                    API URL *
                                                                </label>
                                                                <input
                                                                    type='text'
                                                                    value={
                                                                        connector.apiUrl ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'apiUrl',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                        validationErrors[
                                                                            connector
                                                                                .id
                                                                        ]?.includes(
                                                                            'apiUrl',
                                                                        )
                                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                    }`}
                                                                />
                                                                {validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'apiUrl',
                                                                ) && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {validationMessages[
                                                                            connector
                                                                                .id
                                                                        ]
                                                                            ?.apiUrl ||
                                                                            'API URL is required'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <div className='flex items-center justify-between mb-2'>
                                                                    <label className='block text-sm font-medium text-gray-700'>
                                                                        API
                                                                        Credential
                                                                        Name *
                                                                    </label>
                                                                    <button
                                                                        type='button'
                                                                        onClick={() => {
                                                                            setCredentialModalTarget(
                                                                                'api',
                                                                            );
                                                                            setCredentialModalConnectorId(
                                                                                connector.id,
                                                                            );
                                                                            setShowCredentialModal(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className='flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors'
                                                                    >
                                                                        <Plus className='h-3.5 w-3.5' />
                                                                        <span>
                                                                            Create
                                                                            Credential
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                                <CredentialNameDropdown
                                                                    value={
                                                                        connector.apiCredentialName ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        newValue,
                                                                    ) =>
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'apiCredentialName',
                                                                            newValue,
                                                                        )
                                                                    }
                                                                    selectedAccountId={
                                                                        selectedAccountId
                                                                    }
                                                                    selectedAccountName={
                                                                        selectedAccountName
                                                                    }
                                                                    selectedEnterpriseId={
                                                                        selectedEnterpriseId
                                                                    }
                                                                    selectedEnterprise={
                                                                        selectedEnterprise
                                                                    }
                                                                    workstream={
                                                                        workstream
                                                                    }
                                                                    product={
                                                                        product
                                                                    }
                                                                    service={
                                                                        service
                                                                    }
                                                                    connector={
                                                                        FIXED_CONNECTOR_VALUE
                                                                    }
                                                                    category={
                                                                        FIXED_CATEGORY_VALUE
                                                                    }
                                                                    serviceKeyDetails='API'
                                                                    isError={
                                                                        validationErrors[
                                                                            connector
                                                                                .id
                                                                        ]?.includes(
                                                                            'apiCredentialName',
                                                                        ) ||
                                                                        false
                                                                    }
                                                                    placeholder='Select API credential name...'
                                                                />
                                                                {validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'apiCredentialName',
                                                                ) && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {validationMessages[
                                                                            connector
                                                                                .id
                                                                        ]
                                                                            ?.apiCredentialName ||
                                                                            'API Credential Name is required'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                    IFlow URL *
                                                                </label>
                                                                <input
                                                                    type='text'
                                                                    value={
                                                                        connector.iflowUrl ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'iflowUrl',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                        validationErrors[
                                                                            connector
                                                                                .id
                                                                        ]?.includes(
                                                                            'iflowUrl',
                                                                        )
                                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                    }`}
                                                                />
                                                                {validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'iflowUrl',
                                                                ) && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {validationMessages[
                                                                            connector
                                                                                .id
                                                                        ]
                                                                            ?.iflowUrl ||
                                                                            'IFlow URL is required'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <div className='flex items-center justify-between mb-2'>
                                                                    <label className='block text-sm font-medium text-gray-700'>
                                                                        IFlow
                                                                        Credential
                                                                        Name *
                                                                    </label>
                                                                    <button
                                                                        type='button'
                                                                        onClick={() => {
                                                                            setCredentialModalTarget(
                                                                                'iflow',
                                                                            );
                                                                            setCredentialModalConnectorId(
                                                                                connector.id,
                                                                            );
                                                                            setShowCredentialModal(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className='flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors'
                                                                    >
                                                                        <Plus className='h-3.5 w-3.5' />
                                                                        <span>
                                                                            Create
                                                                            Credential
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                                <CredentialNameDropdown
                                                                    value={
                                                                        connector.iflowCredentialName ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        newValue,
                                                                    ) =>
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'iflowCredentialName',
                                                                            newValue,
                                                                        )
                                                                    }
                                                                    selectedAccountId={
                                                                        selectedAccountId
                                                                    }
                                                                    selectedAccountName={
                                                                        selectedAccountName
                                                                    }
                                                                    selectedEnterpriseId={
                                                                        selectedEnterpriseId
                                                                    }
                                                                    selectedEnterprise={
                                                                        selectedEnterprise
                                                                    }
                                                                    workstream={
                                                                        workstream
                                                                    }
                                                                    product={
                                                                        product
                                                                    }
                                                                    service={
                                                                        service
                                                                    }
                                                                    connector={
                                                                        FIXED_CONNECTOR_VALUE
                                                                    }
                                                                    category={
                                                                        FIXED_CATEGORY_VALUE
                                                                    }
                                                                    serviceKeyDetails='IFlow'
                                                                    isError={
                                                                        validationErrors[
                                                                            connector
                                                                                .id
                                                                        ]?.includes(
                                                                            'iflowCredentialName',
                                                                        ) ||
                                                                        false
                                                                    }
                                                                    placeholder='Select IFlow credential name...'
                                                                />
                                                                {validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'iflowCredentialName',
                                                                ) && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {validationMessages[
                                                                            connector
                                                                                .id
                                                                        ]
                                                                            ?.iflowCredentialName ||
                                                                            'IFlow Credential Name is required'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                    Host URL *
                                                                </label>
                                                                <input
                                                                    type='text'
                                                                    value={
                                                                        connector.hostUrl ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'hostUrl',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                        validationErrors[
                                                                            connector
                                                                                .id
                                                                        ]?.includes(
                                                                            'hostUrl',
                                                                        )
                                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                    }`}
                                                                />
                                                                {validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'hostUrl',
                                                                ) && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {validationMessages[
                                                                            connector
                                                                                .id
                                                                        ]
                                                                            ?.hostUrl ||
                                                                            'Host URL is required'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {(() => {
                                                                const allFilled =
                                                                    !!(
                                                                        connector.environmentType &&
                                                                        connector.apiUrl?.trim() &&
                                                                        connector.apiCredentialName?.trim() &&
                                                                        connector.iflowUrl?.trim() &&
                                                                        connector.iflowCredentialName?.trim() &&
                                                                        connector.hostUrl?.trim()
                                                                    );
                                                                return (
                                                                    <div className='pt-2'>
                                                                        <button
                                                                            type='button'
                                                                            disabled={
                                                                                !allFilled ||
                                                                                isTestingConnectivity
                                                                            }
                                                                            className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                                                                allFilled &&
                                                                                !isTestingConnectivity
                                                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                                                            }`}
                                                                            onClick={() => {
                                                                                testEnvironmentConnectivity(
                                                                                    connector.id,
                                                                                );
                                                                            }}
                                                                        >
                                                                            Test
                                                                        </button>
                                                                        {/* Status / spinner */}
                                                                        <div className='mt-2 min-h-[18px]'>
                                                                            {isTestingConnectivity && (
                                                                                <div className='flex items-center gap-2 text-xs text-slate-700'>
                                                                                    <motion.div
                                                                                        className='w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full'
                                                                                        animate={{
                                                                                            rotate: 360,
                                                                                        }}
                                                                                        transition={{
                                                                                            duration: 1,
                                                                                            repeat: Infinity,
                                                                                            ease: 'linear',
                                                                                        }}
                                                                                    />
                                                                                    <span className='font-medium'>
                                                                                        {connectivityTestMessage ||
                                                                                            'Test in Progress'}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {!isTestingConnectivity &&
                                                                                connectivityTestStatus !==
                                                                                    'idle' && (
                                                                                    <div className='flex items-center gap-2 text-xs'>
                                                                                        {connectivityTestStatus ===
                                                                                        'success' ? (
                                                                                            <CheckCircle className='w-4 h-4 text-green-600' />
                                                                                        ) : (
                                                                                            <AlertTriangle className='w-4 h-4 text-red-600' />
                                                                                        )}
                                                                                        <span
                                                                                            className={
                                                                                                connectivityTestStatus ===
                                                                                                'success'
                                                                                                    ? 'text-green-700 font-medium'
                                                                                                    : 'text-red-700 font-medium'
                                                                                            }
                                                                                        >
                                                                                            {connectivityTestStatus ===
                                                                                            'success'
                                                                                                ? 'Success'
                                                                                                : 'Failed'}
                                                                                        </span>
                                                                                        {connectivityTestTime && (
                                                                                            <span className='text-[10px] text-slate-500'>
                                                                                                {connectivityTestTime.toLocaleTimeString()}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Conditional fields for Username and API Key (Jira) */}
                                                        {connector.authenticationType ===
                                                            'Username and API Key' && (
                                                            <div className='mt-4 space-y-4'>
                                                                {/* Username field with encryption dropdown */}
                                                                <div>
                                                                    <div className='flex items-center justify-between mb-2'>
                                                                        <label className='block text-sm font-medium text-gray-700'>
                                                                            Username
                                                                            *
                                                                        </label>
                                                                        <EncryptionTypeDropdown
                                                                            value={
                                                                                connector.usernameEncryption ||
                                                                                'Plaintext'
                                                                            }
                                                                            onChange={(
                                                                                newValue,
                                                                            ) =>
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'usernameEncryption',
                                                                                    newValue,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                false
                                                                            }
                                                                            isError={
                                                                                false
                                                                            }
                                                                            placeholder='Plaintext'
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type={
                                                                            connector.usernameEncryption ===
                                                                            'Encrypted'
                                                                                ? 'password'
                                                                                : 'text'
                                                                        }
                                                                        value={
                                                                            connector.username ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'username',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'username',
                                                                            )
                                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                        }`}
                                                                    />
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'username',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.username ||
                                                                                'Username is required'}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* API Key field */}
                                                                <div>
                                                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                        API Key
                                                                        *
                                                                    </label>
                                                                    <input
                                                                        type='password'
                                                                        value={
                                                                            connector.apiKey ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'apiKey',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'apiKey',
                                                                            )
                                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                        }`}
                                                                    />
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'apiKey',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.apiKey ||
                                                                                'API Key is required'}
                                                                        </p>
                                                                    )}
                                                                    <div className='mt-1 text-xs text-gray-500'>
                                                                        Default
                                                                        encryption:
                                                                        Encrypted
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Conditional fields for Username and Token (GitHub) */}
                                                        {connector.authenticationType ===
                                                            'Username and Token' && (
                                                            <div className='mt-4 space-y-4'>
                                                                {/* Username field with encryption dropdown */}
                                                                <div>
                                                                    <div className='flex items-center justify-between mb-2'>
                                                                        <label className='block text-sm font-medium text-gray-700'>
                                                                            Username
                                                                            *
                                                                        </label>
                                                                        <EncryptionTypeDropdown
                                                                            value={
                                                                                connector.usernameEncryption ||
                                                                                'Plaintext'
                                                                            }
                                                                            onChange={(
                                                                                newValue,
                                                                            ) =>
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'usernameEncryption',
                                                                                    newValue,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                false
                                                                            }
                                                                            isError={
                                                                                false
                                                                            }
                                                                            placeholder='Plaintext'
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type={
                                                                            connector.usernameEncryption ===
                                                                            'Encrypted'
                                                                                ? 'password'
                                                                                : 'text'
                                                                        }
                                                                        value={
                                                                            connector.username ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'username',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'username',
                                                                            )
                                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                        }`}
                                                                    />
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'username',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.username ||
                                                                                'Username is required'}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Personal Access Token field */}
                                                                <div>
                                                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                        Personal
                                                                        Access
                                                                        Token *
                                                                    </label>
                                                                    <input
                                                                        type='password'
                                                                        value={
                                                                            connector.personalAccessToken ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'personalAccessToken',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'personalAccessToken',
                                                                            )
                                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                        }`}
                                                                    />
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'personalAccessToken',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.personalAccessToken ||
                                                                                'Personal Access Token is required'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Conditional fields for Personal Access Token (Jira) */}
                                                        {connector.authenticationType ===
                                                            'Personal Access Token' && (
                                                            <div className='mt-4'>
                                                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                    Personal
                                                                    Access Token
                                                                    *
                                                                </label>
                                                                <input
                                                                    type='password'
                                                                    value={
                                                                        connector.personalAccessToken ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'personalAccessToken',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                        validationErrors[
                                                                            connector
                                                                                .id
                                                                        ]?.includes(
                                                                            'personalAccessToken',
                                                                        )
                                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                    }`}
                                                                />
                                                                {validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'personalAccessToken',
                                                                ) && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {validationMessages[
                                                                            connector
                                                                                .id
                                                                        ]
                                                                            ?.personalAccessToken ||
                                                                            'Personal Access Token is required'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Conditional fields for GitHub App */}
                                                        {connector.authenticationType ===
                                                            'GitHub App' && (
                                                            <div className='mt-4 space-y-4'>
                                                                {/* GitHub Installation Id field with encryption dropdown */}
                                                                <div>
                                                                    <div className='flex items-center justify-between mb-2'>
                                                                        <label className='block text-sm font-medium text-gray-700'>
                                                                            GitHub
                                                                            Installation
                                                                            Id *
                                                                        </label>
                                                                        <EncryptionTypeDropdown
                                                                            value={
                                                                                connector.githubInstallationIdEncryption ||
                                                                                'Plaintext'
                                                                            }
                                                                            onChange={(
                                                                                newValue,
                                                                            ) =>
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'githubInstallationIdEncryption',
                                                                                    newValue,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                false
                                                                            }
                                                                            isError={
                                                                                false
                                                                            }
                                                                            placeholder='Plaintext'
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type={
                                                                            connector.githubInstallationIdEncryption ===
                                                                            'Encrypted'
                                                                                ? 'password'
                                                                                : 'text'
                                                                        }
                                                                        value={
                                                                            connector.githubInstallationId ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'githubInstallationId',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'githubInstallationId',
                                                                            )
                                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                        }`}
                                                                    />
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'githubInstallationId',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.githubInstallationId ||
                                                                                'GitHub Installation Id is required'}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* GitHub Application Id field with encryption dropdown */}
                                                                <div>
                                                                    <div className='flex items-center justify-between mb-2'>
                                                                        <label className='block text-sm font-medium text-gray-700'>
                                                                            GitHub
                                                                            Application
                                                                            Id *
                                                                        </label>
                                                                        <EncryptionTypeDropdown
                                                                            value={
                                                                                connector.githubApplicationIdEncryption ||
                                                                                'Plaintext'
                                                                            }
                                                                            onChange={(
                                                                                newValue,
                                                                            ) =>
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'githubApplicationIdEncryption',
                                                                                    newValue,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                false
                                                                            }
                                                                            isError={
                                                                                false
                                                                            }
                                                                            placeholder='Plaintext'
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type={
                                                                            connector.githubApplicationIdEncryption ===
                                                                            'Encrypted'
                                                                                ? 'password'
                                                                                : 'text'
                                                                        }
                                                                        value={
                                                                            connector.githubApplicationId ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'githubApplicationId',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'githubApplicationId',
                                                                            )
                                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                        }`}
                                                                    />
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'githubApplicationId',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.githubApplicationId ||
                                                                                'GitHub Application Id is required'}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* GitHub Private Key field */}
                                                                <div>
                                                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                        GitHub
                                                                        Private
                                                                        Key *
                                                                    </label>
                                                                    <input
                                                                        type='password'
                                                                        value={
                                                                            connector.githubPrivateKey ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'githubPrivateKey',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'githubPrivateKey',
                                                                            )
                                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                        }`}
                                                                    />
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'githubPrivateKey',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.githubPrivateKey ||
                                                                                'GitHub Private Key is required'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Conditional fields for OAuth */}
                                                        {connector.authenticationType ===
                                                            'OAuth' && (
                                                            <div className='mt-4'>
                                                                <div className='flex items-center justify-between mb-4'>
                                                                    <div>
                                                                        <p className='text-sm font-medium text-gray-700 mb-1'>
                                                                            GitHub
                                                                            OAuth
                                                                            Authentication
                                                                        </p>
                                                                        <p className='text-xs text-gray-500'>
                                                                            Connect
                                                                            your
                                                                            GitHub
                                                                            account
                                                                            using
                                                                            OAuth
                                                                        </p>
                                                                    </div>
                                                                    <OAuthButton
                                                                        connectorId={
                                                                            connector.id
                                                                        }
                                                                        githubOAuthClientId={
                                                                            githubOAuthClientId
                                                                        }
                                                                        loadingOAuthClientId={
                                                                            loadingOAuthClientId
                                                                        }
                                                                        connectorName={
                                                                            connectorName
                                                                        }
                                                                        connectors={
                                                                            connectors
                                                                        }
                                                                        setOauthStatus={
                                                                            setOauthStatus
                                                                        }
                                                                        setOauthMessages={
                                                                            setOauthMessages
                                                                        }
                                                                        disabled={
                                                                            loadingOAuthClientId ||
                                                                            !githubOAuthClientId ||
                                                                            oauthStatus[
                                                                                connector
                                                                                    .id
                                                                            ] ===
                                                                                'pending'
                                                                        }
                                                                        oauthWindowsRef={
                                                                            oauthWindowsRef
                                                                        }
                                                                    />
                                                                </div>

                                                                {/* OAuth Status Messages */}
                                                                {oauthStatus[
                                                                    connector.id
                                                                ] ===
                                                                    'success' && (
                                                                    <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-3'>
                                                                        <div className='flex items-center gap-2'>
                                                                            <svg
                                                                                className='h-5 w-5 text-green-600 flex-shrink-0'
                                                                                fill='none'
                                                                                viewBox='0 0 24 24'
                                                                                stroke='currentColor'
                                                                            >
                                                                                <path
                                                                                    strokeLinecap='round'
                                                                                    strokeLinejoin='round'
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d='M5 13l4 4L19 7'
                                                                                />
                                                                            </svg>
                                                                            <p className='text-sm font-medium text-green-800'>
                                                                                {oauthMessages[
                                                                                    connector
                                                                                        .id
                                                                                ] ||
                                                                                    'OAuth configured successfully'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {oauthStatus[
                                                                    connector.id
                                                                ] ===
                                                                    'error' && (
                                                                    <div className='bg-red-50 border border-red-200 rounded-lg p-3 mb-3'>
                                                                        <div className='flex items-center gap-2'>
                                                                            <svg
                                                                                className='h-5 w-5 text-red-600 flex-shrink-0'
                                                                                fill='none'
                                                                                viewBox='0 0 24 24'
                                                                                stroke='currentColor'
                                                                            >
                                                                                <path
                                                                                    strokeLinecap='round'
                                                                                    strokeLinejoin='round'
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d='M6 18L18 6M6 6l12 12'
                                                                                />
                                                                            </svg>
                                                                            <p className='text-sm font-medium text-red-800'>
                                                                                {oauthMessages[
                                                                                    connector
                                                                                        .id
                                                                                ] ||
                                                                                    'OAuth authorization failed'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {oauthStatus[
                                                                    connector.id
                                                                ] ===
                                                                    'pending' && (
                                                                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3'>
                                                                        <div className='flex items-center gap-2'>
                                                                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 flex-shrink-0'></div>
                                                                            <p className='text-sm font-medium text-blue-800'>
                                                                                {oauthMessages[
                                                                                    connector
                                                                                        .id
                                                                                ] ||
                                                                                    'OAuth in Progress'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {!oauthStatus[
                                                                    connector.id
                                                                ] && (
                                                                    <div className='space-y-2'>
                                                                        {loadingOAuthClientId && (
                                                                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                                                                                <div className='flex items-center gap-2'>
                                                                                    <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600'></div>
                                                                                    <p className='text-xs text-blue-800'>
                                                                                        Loading
                                                                                        OAuth
                                                                                        configuration...
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {!loadingOAuthClientId &&
                                                                            !githubOAuthClientId && (
                                                                                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                                                                                    <p className='text-xs text-yellow-800 font-medium mb-1'>
                                                                                        ⚠️
                                                                                        GitHub
                                                                                        OAuth
                                                                                        Client
                                                                                        ID
                                                                                        not
                                                                                        configured
                                                                                        in
                                                                                        backend
                                                                                    </p>
                                                                                    <p className='text-xs text-yellow-700 mb-2'>
                                                                                        The
                                                                                        backend
                                                                                        endpoint
                                                                                        is
                                                                                        returning
                                                                                        an
                                                                                        error.
                                                                                        Please
                                                                                        set
                                                                                        the{' '}
                                                                                        <code className='bg-yellow-100 px-1 rounded'>
                                                                                            GITHUB_CLIENT_ID
                                                                                        </code>{' '}
                                                                                        environment
                                                                                        variable
                                                                                        in
                                                                                        your
                                                                                        backend{' '}
                                                                                        <code className='bg-yellow-100 px-1 rounded'>
                                                                                            .env
                                                                                        </code>{' '}
                                                                                        file.
                                                                                    </p>
                                                                                    <p className='text-xs text-yellow-700'>
                                                                                        <strong>
                                                                                            Backend
                                                                                            Setup
                                                                                            Required:
                                                                                        </strong>{' '}
                                                                                        Add{' '}
                                                                                        <code className='bg-yellow-100 px-1 rounded'>
                                                                                            GITHUB_CLIENT_ID=your_client_id_from_github
                                                                                        </code>{' '}
                                                                                        to
                                                                                        your
                                                                                        backend{' '}
                                                                                        <code className='bg-yellow-100 px-1 rounded'>
                                                                                            .env
                                                                                        </code>{' '}
                                                                                        file
                                                                                        and
                                                                                        restart
                                                                                        your
                                                                                        backend
                                                                                        server.
                                                                                        Check
                                                                                        the
                                                                                        browser
                                                                                        console
                                                                                        (F12)
                                                                                        for
                                                                                        detailed
                                                                                        error
                                                                                        messages.
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        {!loadingOAuthClientId &&
                                                                            githubOAuthClientId && (
                                                                                <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                                                                                    <p className='text-xs text-blue-800'>
                                                                                        Click
                                                                                        &quot;Link
                                                                                        to
                                                                                        GitHub&quot;
                                                                                        to
                                                                                        authenticate
                                                                                        with
                                                                                        your
                                                                                        GitHub
                                                                                        account.
                                                                                        You
                                                                                        will
                                                                                        be
                                                                                        redirected
                                                                                        to
                                                                                        GitHub&apos;s
                                                                                        OAuth
                                                                                        authorization
                                                                                        page
                                                                                        in
                                                                                        a
                                                                                        new
                                                                                        tab.
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Show environment summary when not editing */
                                            <div className='bg-white border border-slate-300 rounded-lg p-5 shadow-sm'>
                                                <div className='flex items-center space-x-2 mb-4 pb-3 border-b border-slate-200'>
                                                    <Plug className='h-4 w-4 text-slate-600' />
                                                    <span className='text-sm font-semibold text-slate-800'>
                                                        Environment Information
                                                    </span>
                                                </div>

                                                <div className='space-y-4'>
                                                    {/* Name and Type */}
                                                    <div className='grid grid-cols-2 gap-4'>
                                                        <div>
                                                            <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                Category
                                                            </div>
                                                            <div className='text-sm font-medium text-slate-600'>
                                                                {connector.category ===
                                                                FIXED_CATEGORY_VALUE
                                                                    ? FIXED_CATEGORY_LABEL
                                                                    : connector.category ||
                                                                      'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                Connector
                                                            </div>
                                                            <div className='text-sm font-medium text-slate-600'>
                                                                {connector.connector ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Connectivity Details */}
                                                    <div className='border-t border-slate-200 pt-4 mt-4 space-y-4'>
                                                        <div>
                                                            <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                Environment Type
                                                            </div>
                                                            <div className='text-sm font-medium text-slate-600'>
                                                                {connector.environmentType ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                API URL
                                                            </div>
                                                            <div className='text-sm font-medium text-slate-600 break-words'>
                                                                {connector.apiUrl ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                API Credential
                                                                Name
                                                            </div>
                                                            <div className='text-sm font-medium text-slate-600'>
                                                                {connector.apiCredentialName ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                IFlow URL
                                                            </div>
                                                            <div className='text-sm font-medium text-slate-600 break-words'>
                                                                {connector.iflowUrl ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                IFlow Credential
                                                                Name
                                                            </div>
                                                            <div className='text-sm font-medium text-slate-600'>
                                                                {connector.iflowCredentialName ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                Host URL
                                                            </div>
                                                            <div className='text-sm font-medium text-slate-600 break-words'>
                                                                {connector.hostUrl ||
                                                                    'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Unsaved Changes Confirmation Dialog */}
            <AnimatePresence>
                {showUnsavedChangesDialog && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className='fixed inset-0 z-[10000] flex items-center justify-center p-4'
                    >
                        <div className='absolute inset-0 bg-black bg-opacity-60' />
                        <motion.div
                            initial={{scale: 0.95, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.95, opacity: 0}}
                            className='relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6'
                        >
                            <div className='flex items-center space-x-3 mb-4'>
                                <div className='p-2 bg-amber-100 rounded-full'>
                                    <XCircle className='h-5 w-5 text-amber-600' />
                                </div>
                                <h3 className='text-lg font-semibold text-slate-900'>
                                    Unsaved Changes
                                </h3>
                            </div>

                            <p className='text-slate-600 mb-6'>
                                You have unsaved changes. Would you like to save
                                them before closing?
                            </p>

                            <div className='flex justify-end space-x-3'>
                                <button
                                    onClick={handleDiscardChanges}
                                    className='px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors'
                                >
                                    No, Discard
                                </button>
                                <button
                                    onClick={handleKeepEditing}
                                    className='px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors'
                                >
                                    Yes, Keep Editing
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Assigned Credential Modal */}
            <AssignedCredentialModal
                isOpen={showCredentialModal}
                onClose={() => setShowCredentialModal(false)}
                onSave={async (credentials) => {
                    try {
                        // Get account and enterprise IDs for local storage key
                        const accountId =
                            selectedAccountId ||
                            (typeof window !== 'undefined'
                                ? window.localStorage.getItem(
                                      'selectedAccountId',
                                  )
                                : '') ||
                            '';
                        const enterpriseId =
                            selectedEnterpriseId ||
                            (typeof window !== 'undefined'
                                ? window.localStorage.getItem(
                                      'selectedEnterpriseId',
                                  )
                                : '') ||
                            '';

                        if (!accountId || !enterpriseId) {
                            console.error(
                                '❌ [Credential Save] Missing accountId or enterpriseId',
                            );
                            alert(
                                'Failed to save credential. Missing account or enterprise information.',
                            );
                            return;
                        }

                        // Get the current connector to get category and connector name
                        const currentConnector =
                            connectors.length > 0 ? connectors[0] : null;
                        const connectorCategory =
                            currentConnector?.category || '';
                        const connectorConnector =
                            currentConnector?.connector || connectorName || '';

                        // Load existing credentials from local storage
                        const LOCAL_STORAGE_CREDENTIALS_KEY =
                            'credentials_credentials_data';
                        const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${accountId}_${enterpriseId}`;
                        const stored =
                            typeof window !== 'undefined'
                                ? window.localStorage.getItem(storageKey)
                                : null;
                        const existingCredentials: CredentialRow[] = stored
                            ? JSON.parse(stored)
                            : [];

                        console.log(
                            '💾 [Credential Save] Loaded',
                            existingCredentials.length,
                            'existing credentials from localStorage',
                        );

                        // Process each credential to save
                        for (const credential of credentials) {
                            const finalConnector =
                                (credential as any).connector ||
                                connectorConnector ||
                                '';
                            const finalCategory =
                                (credential as any).category ||
                                connectorCategory ||
                                '';

                            const toolConfig = getToolConfig(finalConnector);
                            const connectorIconName =
                                toolConfig?.iconName || '';

                            // NOTE: Manage Credentials is localStorage-based right now, so we do NOT call any API here.
                            // We only upsert into localStorage and dispatch refresh events.

                            // Build connector object for the credential row (localStorage)
                            const connectorData: any = {
                                id: generateId(),
                                category: finalCategory,
                                connector: finalConnector,
                                connectorIconName: connectorIconName,
                                authenticationType:
                                    credential.authenticationType || '',
                                // Cloud Foundry
                                serviceKeyDetails: (credential as any)
                                    .serviceKeyDetails,
                                oauth2ClientId: (credential as any)
                                    .oauth2ClientId,
                                oauth2ClientSecret: (credential as any)
                                    .oauth2ClientSecret,
                                oauth2TokenUrl: (credential as any)
                                    .oauth2TokenUrl,
                                // Standard fields
                                username: credential.username || '',
                                usernameEncryption:
                                    credential.usernameEncryption ||
                                    'Plaintext',
                                apiKey: credential.apiKey || '',
                                apiKeyEncryption:
                                    credential.apiKeyEncryption || 'Encrypted',
                                personalAccessToken:
                                    credential.personalAccessToken || '',
                                tokenEncryption:
                                    credential.tokenEncryption || 'Plaintext',
                                githubInstallationId:
                                    credential.githubInstallationId || '',
                                githubInstallationIdEncryption:
                                    credential.githubInstallationIdEncryption ||
                                    'Plaintext',
                                githubApplicationId:
                                    credential.githubApplicationId || '',
                                githubApplicationIdEncryption:
                                    credential.githubApplicationIdEncryption ||
                                    'Plaintext',
                                githubPrivateKey:
                                    credential.githubPrivateKey || '',
                                status: true,
                                description: credential.description || '',
                            };

                            // Upsert by credentialName
                            const existingIndex = existingCredentials.findIndex(
                                (cred) =>
                                    cred.credentialName ===
                                    credential.credentialName,
                            );

                            if (existingIndex >= 0) {
                                const existingRow =
                                    existingCredentials[existingIndex];
                                const connectorIndex =
                                    existingRow.connectors?.findIndex(
                                        (c) =>
                                            c.connector ===
                                            connectorData.connector,
                                    ) ?? -1;

                                if (
                                    connectorIndex >= 0 &&
                                    existingRow.connectors
                                ) {
                                    existingRow.connectors[connectorIndex] =
                                        connectorData;
                                } else {
                                    existingRow.connectors =
                                        existingRow.connectors || [];
                                    existingRow.connectors.push(connectorData);
                                }

                                existingRow.description =
                                    credential.description ??
                                    existingRow.description;
                                if (credential.entity)
                                    existingRow.entity = credential.entity;
                                if (credential.product)
                                    existingRow.product = credential.product;
                                if (credential.service)
                                    existingRow.service = credential.service;
                                if (connectorIconName)
                                    existingRow.connectorIconName =
                                        connectorIconName;
                            } else {
                                const newCredentialRow: CredentialRow = {
                                    id: generateId(),
                                    credentialName: credential.credentialName,
                                    description: credential.description || '',
                                    entity:
                                        credential.entity || workstream || '',
                                    product:
                                        credential.product || product || '',
                                    service:
                                        credential.service || service || '',
                                    scope:
                                        credential.scope ||
                                        (credential as any).connector ||
                                        finalConnector ||
                                        '',
                                    connectorIconName: connectorIconName,
                                    connectors: [connectorData],
                                };
                                existingCredentials.push(newCredentialRow);
                            }
                        }

                        // Save updated credentials back to localStorage + dispatch refresh events
                        if (typeof window !== 'undefined') {
                            window.localStorage.setItem(
                                storageKey,
                                JSON.stringify(existingCredentials),
                            );
                            window.dispatchEvent(
                                new CustomEvent('credentialsStorageChanged', {
                                    detail: {
                                        accountId,
                                        enterpriseId,
                                        key: storageKey,
                                    },
                                }),
                            );
                            window.dispatchEvent(
                                new CustomEvent('credentialSaved', {
                                    detail: {
                                        accountId,
                                        enterpriseId,
                                        workstream,
                                        product,
                                        service,
                                        connector: connectorConnector,
                                    },
                                }),
                            );
                        }

                        // Close the modal after successful save
                        setShowCredentialModal(false);

                        // Populate the correct credential field in the Environment form
                        const savedName = credentials?.[0]?.credentialName;
                        if (savedName && credentialModalConnectorId) {
                            if (credentialModalTarget === 'api') {
                                updateConnector(
                                    credentialModalConnectorId,
                                    'apiCredentialName',
                                    savedName,
                                );
                            } else if (credentialModalTarget === 'iflow') {
                                updateConnector(
                                    credentialModalConnectorId,
                                    'iflowCredentialName',
                                    savedName,
                                );
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error saving credential:', error);
                        alert('Failed to save credential. Please try again.');
                    }
                }}
                connectorName={FIXED_CONNECTOR_VALUE}
                category={connectors.length > 0 ? connectors[0]?.category : ''}
                connector={
                    connectors.length > 0
                        ? connectors[0]?.connector
                        : connectorName
                }
                serviceKeyDetails={
                    credentialModalTarget === 'api' ? 'API' : 'IFlow'
                }
                lockServiceKeyDetails={true}
                initialCredentials={[]}
                selectedEnterprise={selectedEnterprise}
                selectedEnterpriseId={selectedEnterpriseId}
                selectedAccountId={selectedAccountId}
                selectedAccountName={selectedAccountName}
                workstream={workstream}
                product={product}
                service={service}
                // Open as a stacked side panel so the Environment modal left panel stays visible
                stackLevel={1}
            />
        </div>
    );
};

export default EnvironmentModal;
