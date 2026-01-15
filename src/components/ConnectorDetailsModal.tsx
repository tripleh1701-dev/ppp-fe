import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
    X,
    Plus,
    Plug,
    Save,
    Edit2,
    XCircle,
    ChevronDown,
    CheckCircle2,
    Loader2,
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
    urlType?: string; // 'Account' or 'Repository' for GitHub Code connector
    connectionType?: string; // 'HTTP' or 'SSH' for GitHub Code connector
    githubAccountUrl?: string; // GitHub Account URL field for GitHub Code connector
    status: boolean; // true = Active, false = Inactive
    description: string;
}

interface ConnectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (connectors: Connector[]) => void; // Bulk save functionality
    onSaveIndividual?: (
        connectors: Connector[],
        connectorName?: string,
        description?: string,
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
    rowId?: string; // ConnectorRow ID for storing test results
    fixedCategoryAndConnector?: boolean; // If true, category and connector fields are fixed/read-only
    fromBuilds?: boolean; // If true, opened from BuildsTable - fields should be blank and mandatory
    connectorDescription?: string; // Description from the row (for Manage Connectors screen)
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
                className={`w-full text-left px-2 py-1 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors min-h-[28px] flex items-center justify-between ${
                    isError
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                        : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                } ${
                    disabled
                        ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-not-allowed'
                        : 'bg-white'
                }`}
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

// Custom Dropdown Component for Credential Name - filters by Account, Enterprise, Workstream, Product, Service, and Connector
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
    connector = '', // Filter by selected connector
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
    connector?: string; // Filter by selected connector
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
        if (!containerRef.current) {
            console.log(
                '⚠️ [CredentialDropdown] Cannot calculate position - containerRef.current is null',
            );
            return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const position = {
            top: rect.bottom + 2,
            left: rect.left,
            width: Math.max(200, rect.width),
        };
        console.log(
            '📍 [CredentialDropdown] Calculated dropdown position:',
            position,
            'from container rect:',
            rect,
        );
        setDropdownPos(position);
    }, []);

    useEffect(() => {
        if (open) {
            // Small delay to ensure container is rendered
            const timer = setTimeout(() => {
                calculateDropdownPosition();
            }, 0);
            const handleReposition = () => {
                if (open) {
                    calculateDropdownPosition();
                }
            };
            window.addEventListener('resize', handleReposition);
            window.addEventListener('scroll', handleReposition, true);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', handleReposition);
                window.removeEventListener('scroll', handleReposition, true);
            };
        } else {
            setDropdownPos(null);
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

            // Filter credentials by account, enterprise, entity (workstream), product, service, and connector
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

                // Match connector - only show credentials that have this connector
                let connectorMatch = true;
                if (connector && connector.trim()) {
                    // Check if credential has connectors array and if it contains the selected connector
                    if (
                        credential.connectors &&
                        credential.connectors.length > 0
                    ) {
                        connectorMatch = credential.connectors.some(
                            (c) =>
                                c.connector &&
                                c.connector.toLowerCase() ===
                                    connector.toLowerCase(),
                        );
                    } else {
                        // If no connectors array, don't show this credential
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
    ]);

    // Load credentials when dropdown opens
    useEffect(() => {
        if (open) {
            loadCredentials();
        }
    }, [open, loadCredentials]);

    // Load credentials when component mounts or value changes (to ensure selected value is available)
    useEffect(() => {
        if (value && selectedAccountId && selectedEnterpriseId) {
            loadCredentials();
        }
    }, [
        value,
        selectedAccountId,
        selectedEnterpriseId,
        workstream,
        product,
        service,
        connector,
        loadCredentials,
    ]);

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
        loadCredentials,
    ]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    // Listen for credential saved event to refresh dropdown
    useEffect(() => {
        if (!selectedAccountId || !selectedEnterpriseId) return;

        const handleCredentialSaved = (event: CustomEvent) => {
            const detail = event.detail;
            console.log(
                '🔄 [CredentialDropdown] Credential saved event received:',
                detail,
            );

            // Reload credentials if the saved credential matches our filters
            if (
                detail.accountId === selectedAccountId &&
                detail.enterpriseId === selectedEnterpriseId
            ) {
                // Check if the saved credential matches our current filters
                const matchesWorkstream =
                    !workstream ||
                    !detail.workstream ||
                    detail.workstream.toLowerCase() ===
                        workstream.toLowerCase();
                const matchesProduct =
                    !product ||
                    !detail.product ||
                    detail.product.toLowerCase() === product.toLowerCase();
                const matchesService =
                    !service ||
                    !detail.service ||
                    detail.service.toLowerCase() === service.toLowerCase();
                const matchesConnector =
                    !connector ||
                    !detail.connector ||
                    detail.connector.toLowerCase() === connector.toLowerCase();

                if (
                    matchesWorkstream &&
                    matchesProduct &&
                    matchesService &&
                    matchesConnector
                ) {
                    console.log(
                        '✅ [CredentialDropdown] Saved credential matches filters - reloading credentials',
                    );
                    loadCredentials();
                } else {
                    console.log(
                        '⚠️ [CredentialDropdown] Saved credential does not match filters - skipping reload',
                    );
                }
            }
        };

        window.addEventListener(
            'credentialSaved',
            handleCredentialSaved as EventListener,
        );
        return () => {
            window.removeEventListener(
                'credentialSaved',
                handleCredentialSaved as EventListener,
            );
        };
    }, [
        selectedAccountId,
        selectedEnterpriseId,
        workstream,
        product,
        service,
        connector,
        loadCredentials,
    ]);

    // Listen for storage changes to refresh credentials when they're deleted/modified in Manage Credentials
    useEffect(() => {
        if (!selectedAccountId || !selectedEnterpriseId) return;

        const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials_credentials_data';
        const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;

        const handleStorageChange = (e: StorageEvent) => {
            // Only react to changes in our credentials storage key
            if (e.key === storageKey) {
                console.log(
                    '🔄 [CredentialDropdown] Storage changed - refreshing credentials',
                );
                // Reload credentials when storage changes
                loadCredentials();

                // If the currently selected credential was deleted, clear the selection
                if (value && e.newValue) {
                    try {
                        const updatedCredentials: CredentialRow[] = JSON.parse(
                            e.newValue,
                        );
                        const credentialExists = updatedCredentials.some(
                            (cred) => cred.credentialName === value,
                        );
                        if (!credentialExists) {
                            console.log(
                                '🗑️ [CredentialDropdown] Selected credential was deleted - clearing selection',
                            );
                            onChange(''); // Clear the selection
                        }
                    } catch (error) {
                        console.error(
                            '❌ [CredentialDropdown] Error parsing storage change:',
                            error,
                        );
                    }
                } else if (value && !e.newValue) {
                    // Storage was cleared - clear selection
                    console.log(
                        '🗑️ [CredentialDropdown] Storage cleared - clearing selection',
                    );
                    onChange('');
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom events (for same-tab updates)
        const handleCustomStorageChange = () => {
            console.log(
                '🔄 [CredentialDropdown] Custom storage event - refreshing credentials',
            );
            loadCredentials();

            // Check if selected credential still exists
            if (value) {
                const stored =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem(storageKey)
                        : null;
                if (stored) {
                    try {
                        const updatedCredentials: CredentialRow[] =
                            JSON.parse(stored);
                        const credentialExists = updatedCredentials.some(
                            (cred) => cred.credentialName === value,
                        );
                        if (!credentialExists) {
                            console.log(
                                '🗑️ [CredentialDropdown] Selected credential was deleted - clearing selection',
                            );
                            onChange('');
                        }
                    } catch (error) {
                        console.error(
                            '❌ [CredentialDropdown] Error checking credential existence:',
                            error,
                        );
                    }
                } else {
                    onChange('');
                }
            }
        };

        // Listen for custom event dispatched when credentials are saved/deleted
        window.addEventListener(
            'credentialsStorageChanged',
            handleCustomStorageChange,
        );

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(
                'credentialsStorageChanged',
                handleCustomStorageChange,
            );
        };
    }, [
        selectedAccountId,
        selectedEnterpriseId,
        value,
        onChange,
        loadCredentials,
    ]);

    // Debug: Log when options change
    useEffect(() => {
        console.log(
            '📋 [CredentialDropdown] Options state updated:',
            options.length,
            'options',
            options,
        );
    }, [options]);

    const selectedOption = options.find((opt) => opt.name === value);

    // If value is set but not in options, show the value anyway (it might be from saved state)
    // This ensures the selected credential name is always displayed even if options haven't loaded yet
    const displayValue =
        value && (selectedOption ? selectedOption.name : value);

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
                        className='fixed z-[9999] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto'
                        style={
                            dropdownPos
                                ? {
                        top: `${dropdownPos.top}px`,
                        left: `${dropdownPos.left}px`,
                        width: `${dropdownPos.width}px`,
                        position: 'fixed',
                                  }
                                : {
                        display: 'none',
                                  }
                        }
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {(() => {
                            console.log(
                                '🎨 [CredentialDropdown] Rendering dropdown:',
                                {
                            loading,
                            optionsLength: options.length,
                            options,
                            dropdownPos,
                                    hasDropdownPos: !!dropdownPos,
                                },
                            );
                        return null;
                    })()}
                    {loading ? (
                            <div className='px-3 py-2 text-sm text-gray-500'>
                                Loading...
                            </div>
                    ) : options.length === 0 ? (
                            <div className='px-3 py-2 text-sm text-gray-500'>
                                No credentials found
                            </div>
                    ) : (
                        options.map((option) => {
                                console.log(
                                    '🎨 [CredentialDropdown] Rendering option:',
                                    option,
                                );
                            return (
                                <button
                                    key={option.id}
                                        type='button'
                                    onClick={() => {
                                            console.log(
                                                '🖱️ [CredentialDropdown] Option clicked:',
                                                option.name,
                                            );
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
                            );
                        })
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
                } pr-8 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors min-h-[28px] flex items-center justify-between ${
                    isError
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                        : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                } ${
                    disabled
                        ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-not-allowed'
                        : 'bg-white'
                }`}
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

const ConnectorDetailsModal: React.FC<ConnectorModalProps> = ({
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
    rowId = '',
    fixedCategoryAndConnector = false,
    fromBuilds = false,
    connectorDescription: propConnectorDescription = '',
}) => {
    const [connectorNameState, setConnectorNameState] = useState<string>(
        connectorName || '',
    );
    const [connectorDescription, setConnectorDescription] =
        useState<string>('');
    const [connectors, setConnectors] = useState<Connector[]>([
        {
        id: generateId(),
        category: '',
        connector: '',
        authenticationType: '',
        url: '',
        credentialName: '',
        username: '',
        usernameEncryption: 'Plaintext',
        apiKey: '',
        apiKeyEncryption: 'Encrypted', // Default to Encrypted
        personalAccessToken: '',
        tokenEncryption: 'Plaintext',
        urlType: 'Account', // Default to 'Account' for GitHub Code connector
        connectionType: 'HTTP', // Default to 'HTTP' for GitHub Code connector
        githubAccountUrl: '',
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
    // Store OAuth window references so we can close them from the parent
    const oauthWindowsRef = useRef<Map<string, Window | null>>(new Map());
    // Ref to track OAuth status for preserving during modal reopen
    const oauthStatusRef = useRef<{
        [connectorId: string]: 'idle' | 'pending' | 'success' | 'error';
    }>({});

    // Test connectivity state per connector
    const [testConnectivityStatus, setTestConnectivityStatus] = useState<{
        [connectorId: string]: 'idle' | 'testing' | 'success' | 'failed';
    }>({});

    // Sync ref with state whenever status changes
    useEffect(() => {
        oauthStatusRef.current = oauthStatus;
    }, [oauthStatus]);

    // Helper function to check if a connector is complete
    const isConnectorComplete = (connector: Connector): boolean => {
        return !!(connector.category?.trim() && connector.connector?.trim());
    };

    // Helper function to validate and clean credential names in connectors
    const validateAndCleanCredentialNames = useCallback(() => {
        if (!selectedAccountId || !selectedEnterpriseId) return;

        try {
            const LOCAL_STORAGE_CREDENTIALS_KEY =
                'credentials_credentials_data';
            const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
            const stored =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem(storageKey)
                    : null;

            if (!stored) {
                // No credentials in storage - clear all credential names
                console.log(
                    '🗑️ [CredentialValidation] No credentials found - clearing all credential names',
                );
                setConnectors((prev) =>
                    prev.map((connector) => {
                    if (connector.credentialName) {
                            console.log(
                                '🗑️ [CredentialValidation] Clearing credential name from connector:',
                                connector.id,
                                connector.credentialName,
                            );
                        return {
                            ...connector,
                            credentialName: '',
                            authenticationType: '',
                            username: '',
                            usernameEncryption: 'Plaintext',
                            apiKey: '',
                            apiKeyEncryption: 'Encrypted',
                            personalAccessToken: '',
                            tokenEncryption: 'Plaintext',
                            githubInstallationId: '',
                            githubInstallationIdEncryption: 'Plaintext',
                            githubApplicationId: '',
                            githubApplicationIdEncryption: 'Plaintext',
                                githubPrivateKey: '',
                        };
                    }
                    return connector;
                    }),
                );
                return;
            }

            const allCredentials: CredentialRow[] = JSON.parse(stored);

            // Check each connector and clear credentialName if it doesn't exist or doesn't match filters
            setConnectors((prev) =>
                prev.map((connector) => {
                if (!connector.credentialName) {
                    return connector; // No credential name to validate
                }

                // Find the credential by name
                const credential = allCredentials.find(
                        (cred) =>
                            cred.credentialName === connector.credentialName,
                );

                // Check if credential exists
                if (!credential) {
                        console.log(
                            '🗑️ [CredentialValidation] Credential name not found - clearing:',
                            connector.credentialName,
                            'from connector:',
                            connector.id,
                        );
                    return {
                        ...connector,
                        credentialName: '',
                        authenticationType: '',
                        username: '',
                        usernameEncryption: 'Plaintext',
                        apiKey: '',
                        apiKeyEncryption: 'Encrypted',
                        personalAccessToken: '',
                        tokenEncryption: 'Plaintext',
                        githubInstallationId: '',
                        githubInstallationIdEncryption: 'Plaintext',
                        githubApplicationId: '',
                        githubApplicationIdEncryption: 'Plaintext',
                            githubPrivateKey: '',
                    };
                }

                // Check if credential matches current workstream/product/service
                    const entityMatch =
                        !workstream ||
                        !credential.entity ||
                        credential.entity.toLowerCase() ===
                            workstream.toLowerCase();
                    const productMatch =
                        !product ||
                        !credential.product ||
                        credential.product.toLowerCase() ===
                            product.toLowerCase();
                    const serviceMatch =
                        !service ||
                        !credential.service ||
                        credential.service.toLowerCase() ===
                            service.toLowerCase();

                // Check if credential has the matching connector
                let connectorMatch = true;
                if (connector.connector && connector.connector.trim()) {
                        if (
                            credential.connectors &&
                            credential.connectors.length > 0
                        ) {
                        connectorMatch = credential.connectors.some(
                                (c) =>
                                    c.connector &&
                                    c.connector.toLowerCase() ===
                                        connector.connector.toLowerCase(),
                        );
                    } else {
                        connectorMatch = false;
                    }
                }

                // If credential doesn't match filters, clear it
                    if (
                        !entityMatch ||
                        !productMatch ||
                        !serviceMatch ||
                        !connectorMatch
                    ) {
                        console.log(
                            '🗑️ [CredentialValidation] Credential does not match filters - clearing:',
                            {
                        credentialName: connector.credentialName,
                        connectorId: connector.id,
                        workstreamMatch: entityMatch,
                        productMatch: productMatch,
                        serviceMatch: serviceMatch,
                        connectorMatch: connectorMatch,
                        credentialWorkstream: credential.entity,
                        credentialProduct: credential.product,
                        credentialService: credential.service,
                        currentWorkstream: workstream,
                        currentProduct: product,
                        currentService: service,
                                connectorName: connector.connector,
                            },
                        );
                    return {
                        ...connector,
                        credentialName: '',
                        authenticationType: '',
                        username: '',
                        usernameEncryption: 'Plaintext',
                        apiKey: '',
                        apiKeyEncryption: 'Encrypted',
                        personalAccessToken: '',
                        tokenEncryption: 'Plaintext',
                        githubInstallationId: '',
                        githubInstallationIdEncryption: 'Plaintext',
                        githubApplicationId: '',
                        githubApplicationIdEncryption: 'Plaintext',
                            githubPrivateKey: '',
                    };
                }

                return connector;
                }),
            );
        } catch (error) {
            console.error(
                '❌ [CredentialValidation] Error validating credential names:',
                error,
            );
        }
    }, [selectedAccountId, selectedEnterpriseId, workstream, product, service]);

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

        // Validate URL or GitHub-specific fields based on connector type
        if (connector.category === 'code' && connector.connector === 'GitHub') {
            // Validate URL Type - required for GitHub Code connector
            if (!connector.urlType || !connector.urlType.trim()) {
                errors.push('urlType');
                messages.urlType = 'URL Type is required';
            }

            // Validate Connection Type - required for GitHub Code connector
            if (!connector.connectionType || !connector.connectionType.trim()) {
                errors.push('connectionType');
                messages.connectionType = 'Connection Type is required';
            }

            // Validate GitHub URL - required for GitHub Code connector
            if (
                !connector.githubAccountUrl ||
                !connector.githubAccountUrl.trim()
            ) {
                errors.push('githubAccountUrl');
                messages.githubAccountUrl =
                    connector.urlType === 'Repository'
                    ? 'GitHub Repository URL is required'
                    : 'GitHub Account URL is required';
            } else {
                // Validate GitHub URL format based on Connection Type and URL Type
                const url = connector.githubAccountUrl.trim();
                if (connector.urlType === 'Account') {
                    // Account URLs: Only account-identifying portion, no repo name
                    if (connector.connectionType === 'HTTP') {
                        // HTTP Account URLs: https://github.com/YOUR_ACCOUNT_NAME/ (no repo name)
                        const httpAccountPattern =
                            /^https?:\/\/github\.com\/[\w.-]+\/?$/i;
                        if (!httpAccountPattern.test(url)) {
                            errors.push('githubAccountUrl');
                            messages.githubAccountUrl =
                                'Account URL must be in format: https://github.com/YOUR_ACCOUNT_NAME/ (do not include repo name)';
                        }
                    } else if (connector.connectionType === 'SSH') {
                        // SSH Account URLs: git@github.com:YOUR_ACCOUNT_NAME/ (no repo name)
                        const sshAccountPattern =
                            /^git@github\.com:[\w.-]+\/?$/i;
                        if (!sshAccountPattern.test(url)) {
                            errors.push('githubAccountUrl');
                            messages.githubAccountUrl =
                                'Account URL must be in format: git@github.com:YOUR_ACCOUNT_NAME/ (do not include repo name)';
                        }
                    }
                } else if (connector.urlType === 'Repository') {
                    // Repository URLs: Complete URL with repo name ending in .git
                    if (connector.connectionType === 'HTTP') {
                        // HTTP Repository URLs: https://github.com/YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git
                        const httpRepoPattern =
                            /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\.git$/i;
                        if (!httpRepoPattern.test(url)) {
                            errors.push('githubAccountUrl');
                            messages.githubAccountUrl =
                                'Repository URL must be in format: https://github.com/YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git';
                        }
                    } else if (connector.connectionType === 'SSH') {
                        // SSH Repository URLs: git@github.com:YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git
                        const sshRepoPattern =
                            /^git@github\.com:[\w.-]+\/[\w.-]+\.git$/i;
                        if (!sshRepoPattern.test(url)) {
                            errors.push('githubAccountUrl');
                            messages.githubAccountUrl =
                                'Repository URL must be in format: git@github.com:YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git';
                        }
                    }
                }
            }
        } else {
            // Validate URL - required for other connectors
            if (!connector.url || !connector.url.trim()) {
                errors.push('url');
                messages.url = 'URL is required';
            }
        }

        // Validate Credential Name - required
        if (!connector.credentialName || !connector.credentialName.trim()) {
            errors.push('credentialName');
            messages.credentialName = 'Credential Name is required';
        }

        // Validate Authentication Type - optional now (kept for backward compatibility)

        // Validate Username and API Key - required if authentication type is Username and API Key (Jira)
        // BUT: Skip validation if credentialName is provided (credentials are stored separately)
        if (
            connector.authenticationType === 'Username and API Key' &&
            !connector.credentialName
        ) {
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
        // BUT: Skip validation if credentialName is provided (credentials are stored separately)
        if (
            connector.authenticationType === 'Username and Token' &&
            !connector.credentialName
        ) {
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
        // BUT: Skip validation if credentialName is provided (credentials are stored separately)
        if (
            connector.authenticationType === 'Personal Access Token' &&
            !connector.credentialName
        ) {
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
        // BUT: Skip validation if credentialName is provided (credentials are stored separately)
        if (
            connector.authenticationType === 'GitHub App' &&
            !connector.credentialName
        ) {
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

            // Only reset if modal was just opened (transition from closed to open)
            // Don't reset if modal is staying open (already had connectors)
            if (wasClosed) {
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
                    // If category and connector are fixed, always show edit form (not summary view)
                    if (fixedCategoryAndConnector) {
                        // Mark all connectors as actively editing to show edit form
                        const editingIds = new Set(
                            initialConnectors.map((c) => c.id),
                        );
                        setActivelyEditingNewConnector(editingIds);
                        setEditingConnectorId(null);
                        console.log(
                            '🔌 Loaded',
                            initialConnectors.length,
                            'connector(s) with fixed category/connector - showing edit form',
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

                    // Validate credential names after loading
                    setTimeout(() => {
                        validateAndCleanCredentialNames();
                    }, 100);
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
                    // Validate credential names even when preserving existing connectors
                    setTimeout(() => {
                        validateAndCleanCredentialNames();
                    }, 100);
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

                    // Validate credential names after loading
                    setTimeout(() => {
                        validateAndCleanCredentialNames();
                    }, 100);
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
    }, [
        isOpen,
        initialConnectors,
        connectors,
        connectorName,
        validateAndCleanCredentialNames,
        fixedCategoryAndConnector,
    ]);

    // Initialize connectorNameState and connectorDescription when modal opens
    useEffect(() => {
        if (isOpen) {
            if (fromBuilds) {
                // When opened from BuildsTable, always start with blank fields
                setConnectorNameState('');
                setConnectorDescription('');
            } else {
                // When opened from Manage Connectors, auto-fill from props
                setConnectorNameState(connectorName || '');
                setConnectorDescription(propConnectorDescription || '');
            }
        }
    }, [isOpen, fromBuilds, connectorName, propConnectorDescription]);

    // Listen for credential storage changes to validate and clean credential names
    useEffect(() => {
        if (!isOpen || !selectedAccountId || !selectedEnterpriseId) return;

        const handleCredentialStorageChange = () => {
            console.log(
                '🔄 [ConnectorModal] Credential storage changed - validating credential names',
            );
            validateAndCleanCredentialNames();
        };

        window.addEventListener(
            'credentialsStorageChanged',
            handleCredentialStorageChange,
        );

        return () => {
            window.removeEventListener(
                'credentialsStorageChanged',
                handleCredentialStorageChange,
            );
        };
    }, [
        isOpen,
        selectedAccountId,
        selectedEnterpriseId,
        validateAndCleanCredentialNames,
    ]);

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
                    // Exclude "deploy" category from the list
                    const allCategories = Object.keys(configDetails).filter(
                        (category) => {
                        // Exclude "deploy" category
                        if (category.toLowerCase() === 'deploy') {
                            return false;
                        }
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
                    // Filter out "deploy" from CATEGORY_ORDER as well
                    const orderedCategories = [
                        ...CATEGORY_ORDER.filter(
                            (cat) =>
                                allCategories.includes(cat) &&
                                cat.toLowerCase() !== 'deploy',
                        ),
                        ...allCategories.filter(
                            (cat) =>
                                !CATEGORY_ORDER.includes(cat as any) &&
                                cat.toLowerCase() !== 'deploy',
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
                category: '',
                connector: '',
                authenticationType: '',
                url: '',
                credentialName: '',
                username: '',
                usernameEncryption: 'Plaintext',
                apiKey: '',
                apiKeyEncryption: 'Encrypted', // Default to Encrypted
                personalAccessToken: '',
                tokenEncryption: 'Plaintext',
                urlType: 'Account', // Default to 'Account' for GitHub Code connector
                connectionType: 'HTTP', // Default to 'HTTP' for GitHub Code connector
                githubAccountUrl: '',
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
                    // Reset test status when connector, credentialName, or url changes
                        if (
                            field === 'connector' ||
                            field === 'credentialName' ||
                            field === 'url'
                        ) {
                            setTestConnectivityStatus((prevStatus) => {
                                const updatedStatus = {...prevStatus};
                            if (updatedStatus[id] !== 'idle') {
                                updatedStatus[id] = 'idle';
                            }
                            return updatedStatus;
                        });
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

    const removeConnector = (id: string) => {
        if (connectors.length > 1) {
            setConnectors((prev) =>
                prev.filter((connector) => connector.id !== id),
            );
        }
    };

    // Test connectivity for a connector
    const testConnectivity = async (connectorId: string) => {
        const connector = connectors.find((c) => c.id === connectorId);
        if (!connector) return;

        // Check if required fields are filled
        // For GitHub Code connector, check githubAccountUrl; for others, check url
        const hasUrl =
            connector.category === 'code' && connector.connector === 'GitHub'
            ? connector.githubAccountUrl
            : connector.url;

        if (!connector.connector || !connector.credentialName || !hasUrl) {
            console.warn('Cannot test connectivity - missing required fields');
            return;
        }

        // Validate accountId and enterpriseId are present (required for OAuth token lookup)
        if (!selectedAccountId || !selectedEnterpriseId) {
            console.warn(
                'Cannot test connectivity - missing accountId or enterpriseId',
            );
            setTestConnectivityStatus((prev) => ({
                ...prev,
                [connectorId]: 'failed',
            }));
            return;
        }

        // Set testing status
        setTestConnectivityStatus((prev) => ({
            ...prev,
            [connectorId]: 'testing',
        }));

        // Simulate minimum test duration (2-3 seconds) for better UX
        const minTestDuration = 2500; // 2.5 seconds minimum
        const testStartTime = Date.now();

        try {
            // Load credential details from localStorage to get username and API token
            let username = '';
            let apiToken = '';
            let foundCredentialConnector: any = null;
            let authType = connector.authenticationType || '';

            if (
                connector.credentialName &&
                selectedAccountId &&
                selectedEnterpriseId
            ) {
                try {
                    const LOCAL_STORAGE_CREDENTIALS_KEY =
                        'credentials_credentials_data';
                    const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                    const stored =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem(storageKey)
                            : null;

                    if (stored) {
                        const allCredentials: CredentialRow[] =
                            JSON.parse(stored);
                        const credential = allCredentials.find(
                            (cred) =>
                                cred.credentialName ===
                                connector.credentialName,
                        );

                        if (
                            credential &&
                            credential.connectors &&
                            credential.connectors.length > 0
                        ) {
                            // Find connector matching the current connector name
                            foundCredentialConnector =
                                credential.connectors.find(
                                    (c) =>
                                        c.connector === connector.connector ||
                                        c.connector.toLowerCase() ===
                                            connector.connector.toLowerCase(),
                            );

                            if (foundCredentialConnector) {
                                console.log(
                                    '🔑 [Test Connectivity] Found credential connector:',
                                    {
                                        credentialConnector:
                                            foundCredentialConnector.connector,
                                        authenticationType:
                                            foundCredentialConnector.authenticationType,
                                        hasUsername:
                                            !!foundCredentialConnector.username,
                                        hasApiKey:
                                            !!foundCredentialConnector.apiKey,
                                        hasPersonalAccessToken:
                                            !!foundCredentialConnector.personalAccessToken,
                                    },
                                );

                                // Determine authentication type from credential connector if not set in connector
                                authType =
                                    connector.authenticationType ||
                                    foundCredentialConnector.authenticationType ||
                                    '';

                                // For JIRA with Username and API Key authentication
                                if (
                                    authType === 'Username and API Key' ||
                                    (!authType &&
                                        foundCredentialConnector.username &&
                                        foundCredentialConnector.apiKey)
                                ) {
                                    username =
                                        foundCredentialConnector.username ||
                                        connector.username ||
                                        '';
                                    apiToken =
                                        foundCredentialConnector.apiKey ||
                                        connector.apiKey ||
                                        '';

                                    // Also update the connector's authentication type if not set
                                    if (
                                        !connector.authenticationType &&
                                        foundCredentialConnector.authenticationType
                                    ) {
                                        updateConnector(
                                            connectorId,
                                            'authenticationType',
                                            foundCredentialConnector.authenticationType,
                                        );
                                    }
                                } else if (
                                    authType === 'Username and Token' ||
                                    (!authType &&
                                        foundCredentialConnector.username &&
                                        foundCredentialConnector.personalAccessToken)
                                ) {
                                    // For GitHub: Username and Token (Personal Access Token)
                                    username =
                                        foundCredentialConnector.username ||
                                        connector.username ||
                                        '';
                                    apiToken =
                                        foundCredentialConnector.personalAccessToken ||
                                        connector.personalAccessToken ||
                                        '';

                                    // Also update the connector's authentication type if not set
                                    if (
                                        !connector.authenticationType &&
                                        foundCredentialConnector.authenticationType
                                    ) {
                                        updateConnector(
                                            connectorId,
                                            'authenticationType',
                                            foundCredentialConnector.authenticationType,
                                        );
                                    }
                                } else if (
                                    authType === 'Personal Access Token' ||
                                    (!authType &&
                                        foundCredentialConnector.personalAccessToken)
                                ) {
                                    apiToken =
                                        foundCredentialConnector.personalAccessToken ||
                                        connector.personalAccessToken ||
                                        '';

                                    // Also update the connector's authentication type if not set
                                    if (
                                        !connector.authenticationType &&
                                        foundCredentialConnector.authenticationType
                                    ) {
                                        updateConnector(
                                            connectorId,
                                            'authenticationType',
                                            foundCredentialConnector.authenticationType,
                                        );
                                    }
                                } else if (authType === 'OAuth') {
                                    // For OAuth, check if OAuth has been successfully configured
                                    // OAuth status is tracked in oauthStatus state
                                    // Also update the connector's authentication type if not set
                                    if (
                                        !connector.authenticationType &&
                                        foundCredentialConnector.authenticationType
                                    ) {
                                        updateConnector(
                                            connectorId,
                                            'authenticationType',
                                            foundCredentialConnector.authenticationType,
                                        );
                                    }
                                }

                                console.log(
                                    '🔑 [Test Connectivity] Extracted credential details:',
                                    {
                                        credentialName:
                                            connector.credentialName,
                                    authenticationType: authType,
                                    hasUsername: !!username,
                                    hasApiToken: !!apiToken,
                                        username: username
                                            ? `${username.substring(0, 5)}...`
                                            : 'none',
                                        apiTokenLength: apiToken
                                            ? apiToken.length
                                            : 0,
                                        apiTokenPreview: apiToken
                                            ? `${apiToken.substring(
                                                  0,
                                                  10,
                                              )}...${apiToken.substring(
                                                  apiToken.length - 5,
                                              )}`
                                            : 'none',
                                    },
                                );

                                // Log full values for verification (be careful with sensitive data in production)
                                console.log(
                                    '✅ [Test Connectivity] FULL VALUES EXTRACTED (for verification):',
                                    {
                                        credentialName:
                                            connector.credentialName,
                                    connectorName: connector.connector,
                                    username: username || '(empty)',
                                        apiToken: apiToken
                                            ? `${apiToken.substring(
                                                  0,
                                                  20,
                                              )}...${apiToken.substring(
                                                  apiToken.length - 10,
                                              )}`
                                            : '(empty)',
                                        apiTokenLength: apiToken
                                            ? apiToken.length
                                            : 0,
                                        authenticationType:
                                            authType || '(empty)',
                                    source: 'credentialConnector',
                                        credentialConnectorFound: true,
                                    },
                                );
                            } else {
                                console.warn(
                                    '⚠️ [Test Connectivity] No matching connector found in credential:',
                                    {
                                        credentialName:
                                            connector.credentialName,
                                    connectorName: connector.connector,
                                        availableConnectors:
                                            credential.connectors.map(
                                                (c) => c.connector,
                                            ),
                                    },
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.error(
                        '❌ [Test Connectivity] Error loading credential from localStorage:',
                        error,
                    );
                }
            }

            // Build test connection payload
            // For GitHub Code connector, use githubAccountUrl; for others, use url
            const urlValue =
                connector.category === 'code' &&
                connector.connector === 'GitHub'
                ? connector.githubAccountUrl || ''
                : connector.url || '';

            // Build test payload with only provided values (no hardcoded defaults)
            const testPayload: any = {
                connectorName: connector.connector,
                url: urlValue,
                credentialName: connector.credentialName,
            };

            // Add GitHub-specific fields for Code connector
            if (
                connector.category === 'code' &&
                connector.connector === 'GitHub'
            ) {
                if (connector.urlType) testPayload.urlType = connector.urlType; // 'Account' or 'Repository'
                if (connector.connectionType)
                    testPayload.connectionType = connector.connectionType; // 'HTTP' or 'SSH'
            }

            // Add context parameters only if they exist (no hardcoded values)
            if (selectedAccountId) testPayload.accountId = selectedAccountId;
            if (selectedAccountName)
                testPayload.accountName = selectedAccountName;
            if (selectedEnterpriseId)
                testPayload.enterpriseId = selectedEnterpriseId;
            if (selectedEnterprise)
                testPayload.enterpriseName = selectedEnterprise;
            if (workstream) testPayload.workstream = workstream;
            if (product) testPayload.product = product;
            if (service) testPayload.service = service;

            // Add authentication details based on authentication type
            // For JIRA: Username and API Key (API Token)
            if (
                authType === 'Username and API Key' ||
                (!authType && username && apiToken)
            ) {
                testPayload.username = username || connector.username || '';
                testPayload.apiToken = apiToken || connector.apiKey || ''; // JIRA uses API Token, not API Key
            } else if (
                authType === 'Username and Token' ||
                (!authType && username && apiToken)
            ) {
                // For GitHub: Username and Token (Personal Access Token)
                testPayload.username = username || connector.username || '';
                testPayload.personalAccessToken =
                    apiToken || connector.personalAccessToken || '';
            } else if (
                authType === 'Personal Access Token' ||
                (!authType && apiToken && !username)
            ) {
                testPayload.personalAccessToken =
                    apiToken || connector.personalAccessToken || '';
            } else if (authType === 'OAuth') {
                // For OAuth authentication, OAuth is already configured in Manage Credentials
                // The backend will use the OAuth token associated with this credential name
                testPayload.authenticationType = 'OAuth';
                // OAuth is configured at the credential level, so we can proceed with testing
                console.log(
                    '🔑 [Test Connectivity] Using OAuth authentication for credential:',
                    connector.credentialName,
                );
            }

            // Validate that we have the required fields (skip validation for OAuth as it's handled above)
            if (
                authType !== 'OAuth' &&
                !testPayload.username &&
                !testPayload.apiToken &&
                !testPayload.personalAccessToken
            ) {
                throw new Error(
                    'Missing authentication credentials. Please ensure the credential contains username and API token.',
                );
            }

            console.log('🧪 [Test Connectivity] Sending test request:', {
                connector: connector.connector,
                url: urlValue,
                credentialName: connector.credentialName,
                authenticationType: authType,
                accountId: selectedAccountId || '(empty)',
                accountName: selectedAccountName || '(empty)',
                enterpriseId: selectedEnterpriseId || '(empty)',
                enterpriseName: selectedEnterprise || '(empty)',
                workstream: workstream || '(empty)',
                product: product || '(empty)',
                service: service || '(empty)',
                hasUsername: !!testPayload.username,
                hasApiToken: !!testPayload.apiToken,
                hasPersonalAccessToken: !!testPayload.personalAccessToken,
                oauthConfigured: testPayload.oauthConfigured,
                username: testPayload.username
                    ? `${testPayload.username.substring(0, 5)}...`
                    : 'none',
                apiTokenLength: testPayload.apiToken
                    ? testPayload.apiToken.length
                    : 0,
                apiTokenPreview: testPayload.apiToken
                    ? `${testPayload.apiToken.substring(
                          0,
                          10,
                      )}...${testPayload.apiToken.substring(
                          testPayload.apiToken.length - 5,
                      )}`
                    : 'none',
                payloadKeys: Object.keys(testPayload),
            });

            // Log full payload values for verification
            console.log(
                '📤 [Test Connectivity] FULL PAYLOAD VALUES (for verification):',
                {
                connectorName: testPayload.connectorName,
                url: testPayload.url,
                credentialName: testPayload.credentialName,
                accountId: testPayload.accountId || '(empty)',
                accountName: testPayload.accountName || '(empty)',
                enterpriseId: testPayload.enterpriseId || '(empty)',
                enterpriseName: testPayload.enterpriseName || '(empty)',
                workstream: testPayload.workstream || '(empty)',
                product: testPayload.product || '(empty)',
                service: testPayload.service || '(empty)',
                username: testPayload.username || '(empty)',
                    apiToken: testPayload.apiToken
                        ? `${testPayload.apiToken.substring(
                              0,
                              20,
                          )}...${testPayload.apiToken.substring(
                              testPayload.apiToken.length - 10,
                          )}`
                        : '(empty)',
                    apiTokenLength: testPayload.apiToken
                        ? testPayload.apiToken.length
                        : 0,
                    personalAccessToken: testPayload.personalAccessToken
                        ? `${testPayload.personalAccessToken.substring(
                              0,
                              20,
                          )}...${testPayload.personalAccessToken.substring(
                              testPayload.personalAccessToken.length - 10,
                          )}`
                        : '(empty)',
                authenticationType: authType || '(empty)',
                fullPayload: {
                    ...testPayload,
                    // Mask sensitive values in full payload log
                        apiToken: testPayload.apiToken
                            ? `[MASKED - Length: ${testPayload.apiToken.length}]`
                            : undefined,
                        personalAccessToken: testPayload.personalAccessToken
                            ? `[MASKED - Length: ${testPayload.personalAccessToken.length}]`
                            : undefined,
                    },
                },
            );

            // Call connectivity test API endpoint
            // For JIRA: /api/connectors/jira/test-connection
            const connectorNameLower = connector.connector
                .toLowerCase()
                .replace(/\s+/g, '-');
            const response = await api.post<{
                success?: boolean;
                status?: string;
                connected?: boolean;
                message?: string;
            }>(
                `/api/connectors/${connectorNameLower}/test-connection`,
                testPayload,
            );

            console.log('🧪 [Test Connectivity] Response received:', response);

            // Ensure minimum test duration has passed
            const elapsedTime = Date.now() - testStartTime;
            const remainingTime = Math.max(0, minTestDuration - elapsedTime);

            if (remainingTime > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, remainingTime),
                );
            }

            // Check if response indicates success
            const success =
                response &&
                (response.success ||
                    response.status === 'success' ||
                    response.connected);
            setTestConnectivityStatus((prev) => ({
                ...prev,
                [connectorId]: success ? 'success' : 'failed',
            }));

            // Store test result in localStorage for Status column in Manage Connectors screen
            if (selectedAccountId && selectedEnterpriseId) {
                try {
                    const STORAGE_KEY = `connector_test_results_${selectedAccountId}_${selectedEnterpriseId}`;
                    const stored =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem(STORAGE_KEY)
                            : null;
                    const results: Record<
                        string,
                        {status: 'success' | 'failed'; timestamp: number}
                    > = stored ? JSON.parse(stored) : {};

                    // If rowId is available, use it; otherwise use connectorName as key (will be migrated when connector is saved)
                    const resultKey =
                        rowId ||
                        (connectorNameState
                            ? `temp_${connectorNameState}_${workstream}_${product}_${service}`
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
                                '💾 [ConnectorDetailsModal] Saved test result to localStorage for key:',
                                resultKey,
                                'status:',
                                success ? 'success' : 'failed',
                                'rowId:',
                                rowId || 'none (using temp key)',
                            );
                            // Dispatch event to notify Status column to refresh
                            window.dispatchEvent(
                                new Event('connectorTestResultUpdated'),
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        '❌ [ConnectorDetailsModal] Error saving test result to localStorage:',
                        error,
                    );
                }
            }

            // Auto-clear success status after 5 seconds
            if (success) {
                setTimeout(() => {
                    setTestConnectivityStatus((prev) => {
                        const updated = {...prev};
                        if (updated[connectorId] === 'success') {
                            updated[connectorId] = 'idle';
                        }
                        return updated;
                    });
                }, 5000);
            }
        } catch (error) {
            // Ensure minimum test duration even on error
            const elapsedTime = Date.now() - testStartTime;
            const remainingTime = Math.max(0, minTestDuration - elapsedTime);

            if (remainingTime > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, remainingTime),
                );
            }

            setTestConnectivityStatus((prev) => ({
                ...prev,
                [connectorId]: 'failed',
            }));

            // Store failed test result in localStorage for Status column in Manage Connectors screen
            if (selectedAccountId && selectedEnterpriseId) {
                try {
                    const STORAGE_KEY = `connector_test_results_${selectedAccountId}_${selectedEnterpriseId}`;
                    const stored =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem(STORAGE_KEY)
                            : null;
                    const results: Record<
                        string,
                        {status: 'success' | 'failed'; timestamp: number}
                    > = stored ? JSON.parse(stored) : {};

                    // If rowId is available, use it; otherwise use connectorName as key (will be migrated when connector is saved)
                    const resultKey =
                        rowId ||
                        (connectorNameState
                            ? `temp_${connectorNameState}_${workstream}_${product}_${service}`
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
                                '💾 [ConnectorDetailsModal] Saved failed test result to localStorage for key:',
                                resultKey,
                                'rowId:',
                                rowId || 'none (using temp key)',
                            );
                            // Dispatch event to notify Status column to refresh
                            window.dispatchEvent(
                                new Event('connectorTestResultUpdated'),
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        '❌ [ConnectorDetailsModal] Error saving test result to localStorage:',
                        error,
                    );
                }
            }

            console.error('Connectivity test failed:', error);

            // Auto-clear failed status after 5 seconds
            setTimeout(() => {
                setTestConnectivityStatus((prev) => {
                    const updated = {...prev};
                    if (updated[connectorId] === 'failed') {
                        updated[connectorId] = 'idle';
                    }
                    return updated;
                });
            }, 5000);
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
            '💾 [ConnectorDetailsModal] Save button clicked - handleSaveIndividualConnector called',
        );
        console.log(
            '💾 [ConnectorDetailsModal] Modal opened from:',
            fixedCategoryAndConnector
                ? 'Manage Builds Screen (Stage Row)'
                : 'Manage Connectors Screen',
        );
        console.log(
            '💾 [ConnectorDetailsModal] Connector Name from header:',
            connectorNameState,
        );
        console.log(
            '💾 [ConnectorDetailsModal] Description from header:',
            connectorDescription,
        );
        console.log('💾 [ConnectorDetailsModal] Connector being saved:', {
            id: connector.id,
            category: connector.category,
            connector: connector.connector,
            urlType: connector.urlType,
            githubAccountUrl: connector.githubAccountUrl,
            url: connector.url,
            credentialName: connector.credentialName,
            authenticationType: connector.authenticationType,
        });

        // Validate connector name is provided
        if (!connectorNameState || !connectorNameState.trim()) {
            console.error(
                '❌ [ConnectorDetailsModal] Validation failed: Connector Name is required',
            );
            alert('Connector Name is required');
            return;
        }

        // Get the latest connector from state to ensure we have the most up-to-date values
        const currentConnector =
            connectors.find((c) => c.id === connector.id) || connector;
        const connectorToSave = {...currentConnector};

        // Update description from header field
        connectorToSave.description = connectorDescription;
        console.log(
            '💾 [ConnectorDetailsModal] Updated connector description:',
            connectorDescription,
        );

        const connectorValidation = validateConnector(connectorToSave);
        if (connectorValidation.errors.length > 0) {
            console.error(
                '❌ [ConnectorDetailsModal] Validation errors:',
                connectorValidation.errors,
            );
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

        console.log(
            '✅ [ConnectorDetailsModal] Validation passed, proceeding with save',
        );

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
            connectorCategory: connectorToSave.category,
            connectorName: connectorToSave.connector,
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
            // Pass connectorNameState along with connectors
            setTimeout(() => {
                onSaveIndividual(
                    validConnectors,
                    connectorNameState.trim(),
                    connectorDescription.trim(),
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
                            <span>Manage Connector</span>
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
                                    Configure Connector
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

                        {/* Connector Info */}
                        <div className='mt-4 grid grid-cols-2 gap-4'>
                            <div>
                                <div className='text-blue-100 text-sm font-medium mb-1'>
                                    Connector Name{fromBuilds ? ' *' : ''}
                                </div>
                                <input
                                    type='text'
                                    value={connectorNameState}
                                    onChange={(e) =>
                                        setConnectorNameState(e.target.value)
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
                                    value={connectorDescription}
                                    onChange={(e) =>
                                        setConnectorDescription(e.target.value)
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
                            {/* Connector Cards */}
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
                                                Connector
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
                                                    <CategoryDropdown
                                                            value={
                                                                connector.category ||
                                                                ''
                                                            }
                                                            onChange={(
                                                                newCategory,
                                                            ) => {
                                                                updateConnector(
                                                                    connector.id,
                                                                    'category',
                                                                    newCategory,
                                                                );
                                                            // Clear connector, credential name, authentication fields, and GitHub-specific fields when category changes
                                                                if (
                                                                    newCategory !==
                                                                    connector.category
                                                                ) {
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'connector',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'credentialName',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'authenticationType',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'username',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'usernameEncryption',
                                                                        'Plaintext',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'apiKey',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'apiKeyEncryption',
                                                                        'Encrypted',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'personalAccessToken',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'tokenEncryption',
                                                                        'Plaintext',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubInstallationId',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubInstallationIdEncryption',
                                                                        'Plaintext',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubApplicationId',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubApplicationIdEncryption',
                                                                        'Plaintext',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubPrivateKey',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'urlType',
                                                                        'Account',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'connectionType',
                                                                        'HTTP',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubAccountUrl',
                                                                        '',
                                                                    );
                                                                }
                                                            }}
                                                            options={
                                                                availableCategories
                                                            }
                                                            disabled={
                                                                fixedCategoryAndConnector ||
                                                                loadingGlobalSettings ||
                                                                availableCategories.length ===
                                                                    0
                                                            }
                                                            isError={
                                                                validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'category',
                                                                ) || false
                                                            }
                                                            placeholder='Select category...'
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
                                                        {!loadingGlobalSettings &&
                                                            availableCategories.length ===
                                                                0 && (
                                                                <p className='text-gray-500 text-xs mt-1'>
                                                                    No
                                                                    categories
                                                                    available
                                                                    for this
                                                                    workstream
                                                                </p>
                                                    )}
                                                </div>

                                                <div>
                                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                        Connector *
                                                    </label>
                                                    <ConnectorDropdown
                                                            value={
                                                                connector.connector ||
                                                                ''
                                                            }
                                                            onChange={(
                                                                newConnector,
                                                            ) => {
                                                                updateConnector(
                                                                    connector.id,
                                                                    'connector',
                                                                    newConnector,
                                                                );
                                                            // Clear authentication type, credential name, authentication fields, and GitHub-specific fields when connector changes
                                                                if (
                                                                    newConnector !==
                                                                    connector.connector
                                                                ) {
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'authenticationType',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'credentialName',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'username',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'usernameEncryption',
                                                                        'Plaintext',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'apiKey',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'apiKeyEncryption',
                                                                        'Encrypted',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'personalAccessToken',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'tokenEncryption',
                                                                        'Plaintext',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubInstallationId',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubInstallationIdEncryption',
                                                                        'Plaintext',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubApplicationId',
                                                                        '',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubApplicationIdEncryption',
                                                                        'Plaintext',
                                                                    );
                                                                    updateConnector(
                                                                        connector.id,
                                                                        'githubPrivateKey',
                                                                        '',
                                                                    );
                                                                // Reset GitHub-specific fields if not GitHub Code connector
                                                                    if (
                                                                        !(
                                                                            connector.category ===
                                                                                'code' &&
                                                                            newConnector ===
                                                                                'GitHub'
                                                                        )
                                                                    ) {
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'urlType',
                                                                            'Account',
                                                                        );
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'connectionType',
                                                                            'HTTP',
                                                                        );
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'githubAccountUrl',
                                                                            '',
                                                                        );
                                                                    }
                                                                }
                                                            }}
                                                            options={
                                                                connector.category
                                                                    ? getOrderedToolsForCategory(
                                                                          connector.category,
                                                                      )
                                                                    : []
                                                            }
                                                            disabled={
                                                                fixedCategoryAndConnector ||
                                                                loadingGlobalSettings ||
                                                                !connector.category ||
                                                                getOrderedToolsForCategory(
                                                                    connector.category,
                                                                ).length === 0
                                                            }
                                                            isError={
                                                                validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'connector',
                                                                ) || false
                                                            }
                                                            placeholder='Select connector...'
                                                            iconName={
                                                                connector.connectorIconName ||
                                                                (connector.connector
                                                                    ? getToolConfig(
                                                                          connector.connector,
                                                                      )
                                                                          ?.iconName
                                                                    : undefined)
                                                            }
                                                        />
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
                                                        {connector.category &&
                                                            getOrderedToolsForCategory(
                                                                connector.category,
                                                            ).length === 0 && (
                                                                <p className='text-gray-500 text-xs mt-1'>
                                                                    No
                                                                    connectors
                                                                    available
                                                                    for this
                                                                    category
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
                                                    {/* GitHub Code Connector Specific Fields */}
                                                        {connector.category ===
                                                            'code' &&
                                                        connector.connector ===
                                                            'GitHub' ? (
                                                        <>
                                                            {/* URL Type Radio Buttons */}
                                                            <div>
                                                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                        URL Type
                                                                        *
                                                                </label>
                                                                    <div className='flex gap-4'>
                                                                        <label className='flex items-center gap-2 cursor-pointer'>
                                                                        <input
                                                                                type='radio'
                                                                            name={`urlType-${connector.id}`}
                                                                                value='Account'
                                                                                checked={
                                                                                    connector.urlType ===
                                                                                    'Account'
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateConnector(
                                                                                        connector.id,
                                                                                        'urlType',
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className='w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                                                                            />
                                                                            <span className='text-sm text-gray-700'>
                                                                                Account
                                                                            </span>
                                                                    </label>
                                                                        <label className='flex items-center gap-2 cursor-pointer'>
                                                                        <input
                                                                                type='radio'
                                                                            name={`urlType-${connector.id}`}
                                                                                value='Repository'
                                                                                checked={
                                                                                    connector.urlType ===
                                                                                    'Repository'
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateConnector(
                                                                                        connector.id,
                                                                                        'urlType',
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className='w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                                                                            />
                                                                            <span className='text-sm text-gray-700'>
                                                                                Repository
                                                                            </span>
                                                                    </label>
                                                                </div>
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'urlType',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.urlType ||
                                                                                'URL Type is required'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Connection Type Radio Buttons */}
                                                            <div>
                                                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                        Connection
                                                                        Type *
                                                                </label>
                                                                    <div className='flex gap-4'>
                                                                        <label className='flex items-center gap-2 cursor-pointer'>
                                                                        <input
                                                                                type='radio'
                                                                            name={`connectionType-${connector.id}`}
                                                                                value='HTTP'
                                                                                checked={
                                                                                    connector.connectionType ===
                                                                                    'HTTP'
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateConnector(
                                                                                        connector.id,
                                                                                        'connectionType',
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className='w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                                                                            />
                                                                            <span className='text-sm text-gray-700'>
                                                                                HTTP
                                                                            </span>
                                                                    </label>
                                                                        <label className='flex items-center gap-2 cursor-pointer'>
                                                                        <input
                                                                                type='radio'
                                                                            name={`connectionType-${connector.id}`}
                                                                                value='SSH'
                                                                                checked={
                                                                                    connector.connectionType ===
                                                                                    'SSH'
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateConnector(
                                                                                        connector.id,
                                                                                        'connectionType',
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className='w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                                                                            />
                                                                            <span className='text-sm text-gray-700'>
                                                                                SSH
                                                                            </span>
                                                                    </label>
                                                                </div>
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'connectionType',
                                                                    ) && (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.connectionType ||
                                                                                'Connection Type is required'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* GitHub URL Field - Changes based on URL Type */}
                                                            <div>
                                                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                        {connector.urlType ===
                                                                        'Repository'
                                                                            ? 'GitHub Repository URL *'
                                                                            : 'GitHub Account URL *'}
                                                                </label>
                                                                <input
                                                                        type='text'
                                                                        value={
                                                                            connector.githubAccountUrl ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'githubAccountUrl',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    placeholder={
                                                                            connector.urlType ===
                                                                            'Repository'
                                                                                ? connector.connectionType ===
                                                                                  'HTTP'
                                                                                ? 'https://github.com/YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git'
                                                                                    : 'git@github.com:YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git'
                                                                                : connector.connectionType ===
                                                                                  'HTTP'
                                                                                ? 'https://github.com/YOUR_ACCOUNT_NAME/'
                                                                                : 'git@github.com:YOUR_ACCOUNT_NAME/'
                                                                    }
                                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'githubAccountUrl',
                                                                            )
                                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                    }`}
                                                                />
                                                                    {validationErrors[
                                                                        connector
                                                                            .id
                                                                    ]?.includes(
                                                                        'githubAccountUrl',
                                                                    ) ? (
                                                                        <p className='text-red-500 text-xs mt-1'>
                                                                            {validationMessages[
                                                                                connector
                                                                                    .id
                                                                            ]
                                                                                ?.githubAccountUrl ||
                                                                                (connector.urlType ===
                                                                                'Repository'
                                                                                    ? 'GitHub Repository URL is required'
                                                                                    : 'GitHub Account URL is required')}
                                                                    </p>
                                                                ) : (
                                                                        <p className='text-gray-500 text-xs mt-1'>
                                                                            {connector.urlType ===
                                                                            'Repository'
                                                                            ? 'Provide the complete URL to the GitHub repository (e.g., https://github.com/YOUR_ACCOUNT_NAME/YOUR_REPO_NAME.git)'
                                                                            : 'Provide only the account-identifying portion of the GitHub URL (e.g., https://github.com/YOUR_ACCOUNT_NAME/). Do not include a repo name.'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        /* Regular URL Field for other connectors */
                                                        <div>
                                                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                URL *
                                                            </label>
                                                            <input
                                                                    type='text'
                                                                    value={
                                                                        connector.url ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateConnector(
                                                                            connector.id,
                                                                            'url',
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
                                                                            'url',
                                                                        )
                                                                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                        : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                                }`}
                                                            />
                                                                {validationErrors[
                                                                    connector.id
                                                                ]?.includes(
                                                                    'url',
                                                                ) && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {validationMessages[
                                                                            connector
                                                                                .id
                                                                        ]
                                                                            ?.url ||
                                                                            'URL is required'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Credential Name Dropdown */}
                                                    <div>
                                                            <div className='flex items-center justify-between mb-2'>
                                                                <label className='block text-sm font-medium text-gray-700'>
                                                                    Credential
                                                                    Name *
                                                            </label>
                                                            <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        setShowCredentialModal(
                                                                            true,
                                                                        )
                                                                    }
                                                                    className='flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors'
                                                                >
                                                                    <Plus className='h-3.5 w-3.5' />
                                                                    <span>
                                                                        Create
                                                                        Credential
                                                                    </span>
                                                            </button>
                                                        </div>
                                                            <div className='flex items-center gap-2'>
                                                                <div className='flex-1'>
                                                                <CredentialNameDropdown
                                                                        value={
                                                                            connector.credentialName ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            newValue,
                                                                        ) => {
                                                                            updateConnector(
                                                                                connector.id,
                                                                                'credentialName',
                                                                                newValue,
                                                                            );

                                                                        // Clear authentication fields when credential name is cleared
                                                                            if (
                                                                                !newValue
                                                                            ) {
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'authenticationType',
                                                                                    '',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'username',
                                                                                    '',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'usernameEncryption',
                                                                                    'Plaintext',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'apiKey',
                                                                                    '',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'apiKeyEncryption',
                                                                                    'Encrypted',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'personalAccessToken',
                                                                                    '',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'tokenEncryption',
                                                                                    'Plaintext',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'githubInstallationId',
                                                                                    '',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'githubInstallationIdEncryption',
                                                                                    'Plaintext',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'githubApplicationId',
                                                                                    '',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'githubApplicationIdEncryption',
                                                                                    'Plaintext',
                                                                                );
                                                                                updateConnector(
                                                                                    connector.id,
                                                                                    'githubPrivateKey',
                                                                                    '',
                                                                                );
                                                                        }

                                                                        // Auto-populate username, API token, and authentication type from credential
                                                                            if (
                                                                                newValue &&
                                                                                selectedAccountId &&
                                                                                selectedEnterpriseId &&
                                                                                connector.connector
                                                                            ) {
                                                                                try {
                                                                                    const LOCAL_STORAGE_CREDENTIALS_KEY =
                                                                                        'credentials_credentials_data';
                                                                                const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                                                                                    const stored =
                                                                                        typeof window !==
                                                                                        'undefined'
                                                                                            ? window.localStorage.getItem(
                                                                                                  storageKey,
                                                                                              )
                                                                                            : null;

                                                                                    if (
                                                                                        stored
                                                                                    ) {
                                                                                        const allCredentials: CredentialRow[] =
                                                                                            JSON.parse(
                                                                                                stored,
                                                                                            );
                                                                                        const credential =
                                                                                            allCredentials.find(
                                                                                                (
                                                                                                    cred,
                                                                                                ) =>
                                                                                                    cred.credentialName ===
                                                                                                    newValue,
                                                                                            );

                                                                                        if (
                                                                                            credential &&
                                                                                            credential.connectors &&
                                                                                            credential
                                                                                                .connectors
                                                                                                .length >
                                                                                                0
                                                                                        ) {
                                                                                        // Find connector matching the current connector name
                                                                                            const credentialConnector =
                                                                                                credential.connectors.find(
                                                                                                    (
                                                                                                        c,
                                                                                                    ) =>
                                                                                                        c.connector ===
                                                                                                        connector.connector,
                                                                                                );

                                                                                            if (
                                                                                                credentialConnector
                                                                                            ) {
                                                                                                console.log(
                                                                                                    '🔑 [Credential] Auto-populating fields from credential:',
                                                                                                    {
                                                                                                        credentialName:
                                                                                                            newValue,
                                                                                                        connector:
                                                                                                            connector.connector,
                                                                                                        hasUsername:
                                                                                                            !!credentialConnector.username,
                                                                                                        hasApiKey:
                                                                                                            !!credentialConnector.apiKey,
                                                                                                        authenticationType:
                                                                                                            credentialConnector.authenticationType,
                                                                                                    },
                                                                                                );

                                                                                            // Log the actual values for verification
                                                                                                console.log(
                                                                                                    '📋 [Credential] Extracted values for verification:',
                                                                                                    {
                                                                                                        credentialName:
                                                                                                            newValue,
                                                                                                        connector:
                                                                                                            connector.connector,
                                                                                                        username:
                                                                                                            credentialConnector.username ||
                                                                                                            '(empty)',
                                                                                                        apiKey: credentialConnector.apiKey
                                                                                                            ? `${credentialConnector.apiKey.substring(
                                                                                                                  0,
                                                                                                                  20,
                                                                                                              )}...${credentialConnector.apiKey.substring(
                                                                                                                  credentialConnector
                                                                                                                      .apiKey
                                                                                                                      .length -
                                                                                                                      10,
                                                                                                              )}`
                                                                                                            : '(empty)',
                                                                                                        apiKeyLength:
                                                                                                            credentialConnector.apiKey
                                                                                                                ? credentialConnector
                                                                                                                      .apiKey
                                                                                                                      .length
                                                                                                                : 0,
                                                                                                        authenticationType:
                                                                                                            credentialConnector.authenticationType ||
                                                                                                            '(empty)',
                                                                                                        fullCredentialConnector:
                                                                                                            credentialConnector, // Full object for debugging
                                                                                                    },
                                                                                                );

                                                                                            // Store authentication type internally (fields will be hidden when credential name is selected)
                                                                                            // Credentials will be pulled from localStorage when testing connectivity
                                                                                                if (
                                                                                                    credentialConnector.authenticationType
                                                                                                ) {
                                                                                                    updateConnector(
                                                                                                        connector.id,
                                                                                                        'authenticationType',
                                                                                                        credentialConnector.authenticationType,
                                                                                                    );
                                                                                            }

                                                                                            // Note: We don't populate username/apiKey fields here since they're hidden when credential name is selected
                                                                                            // These will be pulled from localStorage when testing connectivity
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } catch (error) {
                                                                                    console.error(
                                                                                        '❌ [Credential] Error auto-populating fields:',
                                                                                        error,
                                                                                    );
                                                                                }
                                                                            }
                                                                        }}
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
                                                                            connector.connector ||
                                                                            ''
                                                                        }
                                                                        isError={
                                                                            validationErrors[
                                                                                connector
                                                                                    .id
                                                                            ]?.includes(
                                                                                'credentialName',
                                                                            ) ||
                                                                            false
                                                                        }
                                                                        placeholder='Select credential name...'
                                                                />
                                                            </div>
                                                            {/* Test Connectivity Button */}
                                                            <button
                                                                    type='button'
                                                                    onClick={() =>
                                                                        testConnectivity(
                                                                            connector.id,
                                                                        )
                                                                    }
                                                                disabled={
                                                                        testConnectivityStatus[
                                                                            connector
                                                                                .id
                                                                        ] ===
                                                                            'testing' ||
                                                                    !connector.connector ||
                                                                    !connector.credentialName ||
                                                                    // For GitHub Code connector, check githubAccountUrl; for others, check url
                                                                        (connector.category ===
                                                                            'code' &&
                                                                        connector.connector ===
                                                                            'GitHub'
                                                                        ? !connector.githubAccountUrl
                                                                        : !connector.url)
                                                                }
                                                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                                                                        testConnectivityStatus[
                                                                            connector
                                                                                .id
                                                                        ] ===
                                                                        'testing'
                                                                        ? 'bg-blue-100 text-blue-700 cursor-wait'
                                                                            : testConnectivityStatus[
                                                                                  connector
                                                                                      .id
                                                                              ] ===
                                                                              'success'
                                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                            : testConnectivityStatus[
                                                                                  connector
                                                                                      .id
                                                                              ] ===
                                                                              'failed'
                                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                                } ${
                                                                        testConnectivityStatus[
                                                                            connector
                                                                                .id
                                                                        ] ===
                                                                            'testing' ||
                                                                    !connector.connector ||
                                                                    !connector.credentialName ||
                                                                        (connector.category ===
                                                                            'code' &&
                                                                        connector.connector ===
                                                                            'GitHub'
                                                                        ? !connector.githubAccountUrl
                                                                            : !connector.url)
                                                                        ? 'opacity-50 cursor-not-allowed'
                                                                        : 'cursor-pointer'
                                                                }`}
                                                            >
                                                                    {testConnectivityStatus[
                                                                        connector
                                                                            .id
                                                                    ] ===
                                                                    'testing' ? (
                                                                        <>
                                                                            <Loader2 className='h-4 w-4 animate-spin' />
                                                                            <span>
                                                                                Test
                                                                                in
                                                                                Progress
                                                                            </span>
                                                                        </>
                                                                    ) : testConnectivityStatus[
                                                                          connector
                                                                              .id
                                                                      ] ===
                                                                      'success' ? (
                                                                        <>
                                                                            <CheckCircle2 className='h-4 w-4' />
                                                                            <span>
                                                                                Success
                                                                            </span>
                                                                    </>
                                                                ) : (
                                                                        <span>
                                                                            Test
                                                                        </span>
                                                                )}
                                                            </button>
                                                        </div>
                                                            {validationErrors[
                                                                connector.id
                                                            ]?.includes(
                                                                'credentialName',
                                                            ) && (
                                                                <p className='text-red-500 text-xs mt-1'>
                                                                    {validationMessages[
                                                                        connector
                                                                            .id
                                                                    ]
                                                                        ?.credentialName ||
                                                                        'Credential Name is required'}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Conditional fields for Username and API Key (Jira) - Hide when credential name is selected */}
                                                        {connector.authenticationType ===
                                                            'Username and API Key' &&
                                                            !connector.credentialName && (
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
                                                                            API
                                                                            Key
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

                                                    {/* Conditional fields for Username and Token (GitHub) - Hide when credential name is selected */}
                                                        {connector.authenticationType ===
                                                            'Username and Token' &&
                                                            !connector.credentialName && (
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
                                                                            Token
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

                                                    {/* Conditional fields for Personal Access Token (Jira) - Hide when credential name is selected */}
                                                        {connector.authenticationType ===
                                                            'Personal Access Token' &&
                                                            !connector.credentialName && (
                                                                <div className='mt-4'>
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
                                                    )}

                                                    {/* Conditional fields for GitHub App - Hide when credential name is selected */}
                                                        {connector.authenticationType ===
                                                            'GitHub App' &&
                                                            !connector.credentialName && (
                                                                <div className='mt-4 space-y-4'>
                                                            {/* GitHub Installation Id field with encryption dropdown */}
                                                            <div>
                                                                        <div className='flex items-center justify-between mb-2'>
                                                                            <label className='block text-sm font-medium text-gray-700'>
                                                                                GitHub
                                                                                Installation
                                                                                Id
                                                                                *
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
                                                                                Id
                                                                                *
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
                                                                            Key
                                                                            *
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

                                                    {/* Conditional fields for OAuth - Hide when credential name is selected */}
                                                        {connector.authenticationType ===
                                                            'OAuth' &&
                                                            !connector.credentialName && (
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
                                                                        connector
                                                                            .id
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
                                                                        connector
                                                                            .id
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
                                                                        connector
                                                                            .id
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
                                                                        connector
                                                                            .id
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
                                        /* Show connector summary when not editing */
                                            <div className='bg-white border border-slate-300 rounded-lg p-5 shadow-sm'>
                                                <div className='flex items-center space-x-2 mb-4 pb-3 border-b border-slate-200'>
                                                    <Plug className='h-4 w-4 text-slate-600' />
                                                    <span className='text-sm font-semibold text-slate-800'>
                                                        Connector Information
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
                                                                {connector.category ||
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
                                                    {/* GitHub Code Connector Specific Fields */}
                                                        {connector.category ===
                                                            'code' &&
                                                        connector.connector ===
                                                            'GitHub' ? (
                                                        <>
                                                                <div className='grid grid-cols-2 gap-4'>
                                                                <div>
                                                                        <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                            URL
                                                                            Type
                                                                        </div>
                                                                        <div className='text-sm font-medium text-slate-600'>
                                                                            {connector.urlType ||
                                                                                'N/A'}
                                                                        </div>
                                                                </div>
                                                                <div>
                                                                        <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                            Connection
                                                                            Type
                                                                        </div>
                                                                        <div className='text-sm font-medium text-slate-600'>
                                                                            {connector.connectionType ||
                                                                                'N/A'}
                                                                        </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                    <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                        {connector.urlType ===
                                                                        'Repository'
                                                                            ? 'GitHub Repository URL'
                                                                            : 'GitHub Account URL'}
                                                                </div>
                                                                    <div className='text-sm font-medium text-slate-600 break-words'>
                                                                        {connector.githubAccountUrl ||
                                                                            'N/A'}
                                                                    </div>
                                                            </div>
                                                            <div>
                                                                    <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                        Credential
                                                                        Name
                                                                    </div>
                                                                    <div className='text-sm font-medium text-slate-600'>
                                                                        {connector.credentialName ||
                                                                            'N/A'}
                                                                    </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                    <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                        URL
                                                                    </div>
                                                                    <div className='text-sm font-medium text-slate-600 break-words'>
                                                                        {connector.url ||
                                                                            'N/A'}
                                                                    </div>
                                                            </div>
                                                            <div>
                                                                    <div className='text-xs font-bold text-slate-800 uppercase tracking-wide mb-1'>
                                                                        Credential
                                                                        Name
                                                                    </div>
                                                                    <div className='text-sm font-medium text-slate-600'>
                                                                        {connector.credentialName ||
                                                                            'N/A'}
                                                                    </div>
                                                            </div>
                                                        </>
                                                    )}
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
                            // Ensure we have the correct connector value
                            const finalConnector =
                                credential.connector ||
                                connectorConnector ||
                                '';
                            const finalCategory =
                                credential.category || connectorCategory || '';

                            // Get connector icon name from tool config
                            const toolConfig = getToolConfig(finalConnector);
                            const connectorIconName =
                                toolConfig?.iconName || '';

                            console.log(
                                '💾 [Credential Save] Saving credential:',
                                {
                                credentialName: credential.credentialName,
                                entity: credential.entity || workstream,
                                product: credential.product || product,
                                service: credential.service || service,
                                category: finalCategory,
                                connector: finalConnector,
                                connectorIconName: connectorIconName,
                                    authenticationType:
                                        credential.authenticationType,
                                },
                            );

                            // Build connector object for the credential row
                            const connectorData = {
                                id: generateId(),
                                category: finalCategory,
                                connector: finalConnector,
                                connectorIconName: connectorIconName, // Add connector icon name
                                authenticationType:
                                    credential.authenticationType || '',
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
                                status: true, // Default to Active
                                description: credential.description || '',
                            };

                            // Check if credential row already exists (by credentialName)
                            const existingIndex = existingCredentials.findIndex(
                                (cred) =>
                                    cred.credentialName ===
                                    credential.credentialName,
                            );

                            if (existingIndex >= 0) {
                                // Update existing credential row
                                const existingRow =
                                    existingCredentials[existingIndex];

                                // Check if connector already exists in this credential row
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
                                    // Update existing connector
                                    existingRow.connectors[connectorIndex] =
                                        connectorData;
                                    console.log(
                                        '🔄 [Credential Save] Updated existing connector in credential:',
                                        credential.credentialName,
                                    );
                                } else {
                                    // Add new connector to existing credential row
                                    existingRow.connectors =
                                        existingRow.connectors || [];
                                    existingRow.connectors.push(connectorData);
                                    console.log(
                                        '➕ [Credential Save] Added new connector to existing credential:',
                                        credential.credentialName,
                                    );
                                }

                                // Update other fields if provided
                                if (credential.description !== undefined) {
                                    existingRow.description =
                                        credential.description;
                                }
                                if (credential.entity) {
                                    existingRow.entity = credential.entity;
                                }
                                if (credential.product) {
                                    existingRow.product = credential.product;
                                }
                                if (credential.service) {
                                    existingRow.service = credential.service;
                                }
                                // Update connector icon name if connector was added/updated
                                if (connectorIconName) {
                                    existingRow.connectorIconName =
                                        connectorIconName;
                                }
                            } else {
                                // Create new credential row
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
                                        credential.connector ||
                                        connectorConnector ||
                                        '',
                                    connectorIconName: connectorIconName, // Add connector icon name at row level
                                    connectors: [connectorData],
                                };

                                console.log(
                                    '➕ [Credential Save] Created new credential row:',
                                    {
                                        credentialName:
                                            newCredentialRow.credentialName,
                                    entity: newCredentialRow.entity,
                                    product: newCredentialRow.product,
                                    service: newCredentialRow.service,
                                        connectorIconName:
                                            newCredentialRow.connectorIconName,
                                        connectorCount:
                                            newCredentialRow.connectors
                                                ?.length || 0,
                                        connector:
                                            newCredentialRow.connectors?.[0]
                                                ?.connector || 'N/A',
                                        category:
                                            newCredentialRow.connectors?.[0]
                                                ?.category || 'N/A',
                                    },
                                );

                                existingCredentials.push(newCredentialRow);
                            }
                        }

                        // Save updated credentials back to local storage
                        if (typeof window !== 'undefined') {
                            window.localStorage.setItem(
                                storageKey,
                                JSON.stringify(existingCredentials),
                            );
                            console.log(
                                '✅ [Credential Save] Saved',
                                existingCredentials.length,
                                'credentials to localStorage',
                            );
                            console.log(
                                '✅ [Credential Save] Storage key:',
                                storageKey,
                            );

                            // Dispatch custom event to notify other components (like Manage Credentials screen) about the change
                            window.dispatchEvent(
                                new CustomEvent('credentialsStorageChanged', {
                                    detail: {
                                        accountId,
                                        enterpriseId,
                                        key: storageKey,
                                    },
                                }),
                            );
                        }

                        // Close the modal after successful save
                        setShowCredentialModal(false);

                        // Trigger refresh of credential dropdown by dispatching a custom event
                        // The CredentialNameDropdown will listen to this event and reload credentials
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(
                                new CustomEvent('credentialSaved', {
                                detail: {
                                        credentialName:
                                            credentials[0]?.credentialName,
                                    accountId,
                                    enterpriseId,
                                        workstream:
                                            workstream ||
                                            credentials[0]?.entity,
                                        product:
                                            product || credentials[0]?.product,
                                        service:
                                            service || credentials[0]?.service,
                                        connector: connectorConnector,
                                    },
                                }),
                            );
                        }

                        // Show success message
                        console.log(
                            '✅ Credential saved successfully to local storage',
                        );
                    } catch (error) {
                        console.error('❌ Error saving credential:', error);
                        alert('Failed to save credential. Please try again.');
                    }
                }}
                connectorName={connectorName}
                category={connectors.length > 0 ? connectors[0]?.category : ''}
                connector={
                    connectors.length > 0
                        ? connectors[0]?.connector
                        : connectorName
                }
                initialCredentials={[]}
                selectedEnterprise={selectedEnterprise}
                selectedEnterpriseId={selectedEnterpriseId}
                selectedAccountId={selectedAccountId}
                selectedAccountName={selectedAccountName}
                workstream={workstream}
                product={product}
                service={service}
                stackLevel={1}
            />
        </div>
    );
};

export default ConnectorDetailsModal;
