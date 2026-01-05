'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Layers, ChevronDown, XCircle } from 'lucide-react';
import { BookmarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { api } from '@/utils/api';
import IntegrationArtifactsTable, { IntegrationArtifactRow } from './IntegrationArtifactsTable';

export interface BuildRow {
    id: string;
    connectorName: string;
    description?: string;
    entity: string;
    pipeline?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    product: string;
    service: string;
    scope?: string;
}

interface IntegrationArtifactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
    row: BuildRow;
    selectedAccountId?: string;
    selectedAccountName?: string;
    selectedEnterpriseId?: string;
    selectedEnterprise?: string;
    stackLevel?: number;
}

const IntegrationArtifactsModal: React.FC<IntegrationArtifactsModalProps> = ({
    isOpen,
    onClose,
    onSave,
    row,
    selectedAccountId = '',
    selectedAccountName = '',
    selectedEnterpriseId = '',
    selectedEnterprise = '',
    stackLevel = 0,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // Applied search term
    const [environmentName, setEnvironmentName] = useState('');
    const [environmentOptions, setEnvironmentOptions] = useState<Array<{id: string; name: string}>>([]);
    const [loadingEnvironments, setLoadingEnvironments] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [artifacts, setArtifacts] = useState<IntegrationArtifactRow[]>([]);
    const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([]); // Track selected artifact IDs
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track if there are unsaved changes
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false); // Show confirmation dialog
    const [originalSelectedArtifacts, setOriginalSelectedArtifacts] = useState<string[]>([]); // Track original selections when modal opens
    const modalRef = useRef<HTMLDivElement | null>(null);
    const prevSelectedArtifactsRef = useRef<string[]>([]); // Track previous selections to detect changes

    // Get localStorage key for selected artifacts
    const getLocalStorageKey = useCallback(() => {
        if (!selectedAccountId || !selectedEnterpriseId || !row.id) {
            return null;
        }
        return `integration_artifacts_selected_${selectedAccountId}_${selectedEnterpriseId}_${row.id}`;
    }, [selectedAccountId, selectedEnterpriseId, row.id]);

    // Get localStorage key for environment name
    const getEnvironmentNameKey = useCallback(() => {
        if (!selectedAccountId || !selectedEnterpriseId || !row.id) {
            return null;
        }
        return `integration_artifacts_environment_${selectedAccountId}_${selectedEnterpriseId}_${row.id}`;
    }, [selectedAccountId, selectedEnterpriseId, row.id]);

    // Check if build has been triggered (has build count > 0)
    const hasBuildTriggered = useCallback(() => {
        // Check if the row has any builds triggered
        // For now, we'll check if there's a build count stored in localStorage
        // This should be enhanced when build tracking is fully implemented
        if (!selectedAccountId || !selectedEnterpriseId || !row.id) {
            return false;
        }
        const buildCountKey = `build_count_${selectedAccountId}_${selectedEnterpriseId}_${row.id}`;
        const buildCount = typeof window !== 'undefined' ? window.localStorage.getItem(buildCountKey) : null;
        return buildCount ? parseInt(buildCount, 10) > 0 : false;
    }, [selectedAccountId, selectedEnterpriseId, row.id]);

    // Load selected artifacts from localStorage
    const loadSelectedArtifactsFromStorage = useCallback(() => {
        const key = getLocalStorageKey();
        if (!key) return [];
        
        try {
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
            if (stored) {
                const parsed = JSON.parse(stored);
                console.log('📦 [IntegrationArtifacts] Loaded selected artifacts from localStorage:', parsed.length);
                return Array.isArray(parsed) ? parsed : [];
            }
        } catch (error) {
            console.error('❌ [IntegrationArtifacts] Error loading selected artifacts from localStorage:', error);
        }
        return [];
    }, [getLocalStorageKey]);

    // Save selected artifacts to localStorage
    const saveSelectedArtifactsToStorage = useCallback((artifactIds: string[]) => {
        const key = getLocalStorageKey();
        if (!key) return;
        
        try {
            typeof window !== 'undefined' && window.localStorage.setItem(key, JSON.stringify(artifactIds));
            console.log('💾 [IntegrationArtifacts] Saved selected artifacts to localStorage:', artifactIds.length);
        } catch (error) {
            console.error('❌ [IntegrationArtifacts] Error saving selected artifacts to localStorage:', error);
        }
    }, [getLocalStorageKey]);

    // Load environment name from localStorage
    const loadEnvironmentNameFromStorage = useCallback(() => {
        const key = getEnvironmentNameKey();
        if (!key) return '';
        
        try {
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
            if (stored) {
                console.log('📦 [IntegrationArtifacts] Loaded environment name from localStorage:', stored);
                return stored;
            }
        } catch (error) {
            console.error('❌ [IntegrationArtifacts] Error loading environment name from localStorage:', error);
        }
        return '';
    }, [getEnvironmentNameKey]);

    // Save environment name to localStorage
    const saveEnvironmentNameToStorage = useCallback((envName: string) => {
        const key = getEnvironmentNameKey();
        if (!key) return;
        
        try {
            typeof window !== 'undefined' && window.localStorage.setItem(key, envName);
            console.log('💾 [IntegrationArtifacts] Saved environment name to localStorage:', envName);
        } catch (error) {
            console.error('❌ [IntegrationArtifacts] Error saving environment name to localStorage:', error);
        }
    }, [getEnvironmentNameKey]);

    // Custom Dropdown Component for Environment Name - matches CredentialNameDropdown style
    const EnvironmentNameDropdown = ({
        value,
        onChange,
        disabled = false,
        isError = false,
        placeholder = 'Select environment name...',
    }: {
        value: string;
        onChange: (value: string) => void;
        disabled?: boolean;
        isError?: boolean;
        placeholder?: string;
    }) => {
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
                window.addEventListener('resize', handleReposition);
                window.addEventListener('scroll', handleReposition, true);
                return () => {
                    window.removeEventListener('resize', handleReposition);
                    window.removeEventListener('scroll', handleReposition, true);
                };
            }
        }, [open, calculateDropdownPosition]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as Node;
                const clickedInsideTrigger = !!containerRef.current && containerRef.current.contains(target);
                const clickedInsideDropdown = !!dropdownRef.current && dropdownRef.current.contains(target);
                if (!clickedInsideTrigger && !clickedInsideDropdown) {
                    setOpen(false);
                }
            };

            if (open) {
                document.addEventListener('mousedown', handleClickOutside);
                return () => document.removeEventListener('mousedown', handleClickOutside);
            }
        }, [open]);

        const selectedOption = environmentOptions.find(opt => opt.name === value);
        const displayValue = value && value.trim()
            ? (selectedOption ? selectedOption.name : value)
            : '';

        return (
            <div ref={containerRef} className="relative w-full">
                <button
                    type="button"
                    onClick={() => !disabled && setOpen(!open)}
                    disabled={disabled}
                    className={`w-full px-2 py-1 border rounded-lg text-sm text-left focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] flex items-center justify-between ${
                        isError
                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <span className={displayValue ? 'text-gray-900' : 'text-gray-500'}>
                        {displayValue || placeholder}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'transform rotate-180' : ''}`} />
                </button>

                {open && createPortal(
                    <div
                        ref={dropdownRef}
                        className="fixed z-[10050] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                        style={dropdownPos ? {
                            top: `${dropdownPos.top}px`,
                            left: `${dropdownPos.left}px`,
                            width: `${dropdownPos.width}px`,
                        } : undefined}
                    >
                        {loadingEnvironments ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                        ) : environmentOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">No environments found</div>
                        ) : (
                            environmentOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.name);
                                        setOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                        value === option.name ? 'bg-blue-100 font-medium' : ''
                                    }`}
                                >
                                    {option.name}
                                </button>
                            ))
                        )}
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    const PANEL_BASE_WIDTH = 1100;
    const SIDE_PANEL_WIDTH = 40;
    const MIN_PANEL_WIDTH = 750;
    const normalizedStackLevel = Math.max(0, stackLevel);
    const panelOffset = Math.min(normalizedStackLevel * SIDE_PANEL_WIDTH, PANEL_BASE_WIDTH - MIN_PANEL_WIDTH);
    const modalWidth = PANEL_BASE_WIDTH - panelOffset;
    const overlayZIndex = 10000 + normalizedStackLevel;
    const isTopLevelModal = normalizedStackLevel === 0;

    // Load environments from localStorage (same as Manage Environments screen)
    // Filtered by account, enterprise, workstream (entity), product, and service
    const loadEnvironments = useCallback(async () => {
        if (!selectedAccountId || !selectedEnterpriseId) {
            console.log('⚠️ [IntegrationArtifacts] Missing account or enterprise, clearing environments');
            setEnvironmentOptions([]);
            return;
        }

        setLoadingEnvironments(true);
        try {
            console.log('🔍 [IntegrationArtifacts] Loading environments from localStorage for:', {
                accountId: selectedAccountId,
                enterpriseId: selectedEnterpriseId,
                workstream: row.entity,
                product: row.product,
                service: row.service
            });

            // Use the same localStorage key structure as Manage Environments
            const LOCAL_STORAGE_ENVIRONMENTS_KEY = 'environments_environments_data';
            const getLocalStorageKey = (accountId: string, enterpriseId: string): string => {
                if (accountId && enterpriseId) {
                    return `${LOCAL_STORAGE_ENVIRONMENTS_KEY}_${accountId}_${enterpriseId}`;
                }
                return LOCAL_STORAGE_ENVIRONMENTS_KEY;
            };

            const key = getLocalStorageKey(selectedAccountId, selectedEnterpriseId);
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
            
            if (!stored) {
                console.log('⚠️ [IntegrationArtifacts] No environments found in localStorage for this account/enterprise');
                setEnvironmentOptions([]);
                setLoadingEnvironments(false);
                return;
            }

            // Parse environments from localStorage
            // EnvironmentRow structure: { id, connectorName (environment name), entity, product, service, ... }
            const allEnvironments: Array<{
                id: string;
                connectorName: string; // This is the Environment Name
                entity: string;
                product: string;
                service: string;
            }> = JSON.parse(stored);

            console.log('📦 [IntegrationArtifacts] Loaded environments from localStorage:', allEnvironments.length, 'total');

            // Filter environments by workstream (entity), product, and service
            // Must match the same account, enterprise (already filtered by localStorage key), workstream, product, and service
            const filteredEnvironments = allEnvironments.filter(env => {
                // Match entity (workstream)
                const entityMatch = !row.entity || 
                    (env.entity && env.entity.toLowerCase().trim() === row.entity.toLowerCase().trim());
                
                // Match product
                const productMatch = !row.product || 
                    (env.product && env.product.toLowerCase().trim() === row.product.toLowerCase().trim());
                
                // Match service
                const serviceMatch = !row.service || 
                    (env.service && env.service.toLowerCase().trim() === row.service.toLowerCase().trim());
                
                return entityMatch && productMatch && serviceMatch;
            });

            console.log('✅ [IntegrationArtifacts] Filtered environments:', filteredEnvironments.length, 'matching filters');

            // Extract unique environment names (connectorName field)
            const uniqueEnvironments = Array.from(new Set(
                filteredEnvironments
                    .map(env => env.connectorName)
                    .filter(name => name && name.trim() !== '')
            ));

            console.log('✅ [IntegrationArtifacts] Unique environment names:', uniqueEnvironments);
            
            // Convert to the expected format
            const allData = uniqueEnvironments.map((envName, index) => ({
                id: `environment-${envName}-${index}`,
                name: envName
            }));
            
            setEnvironmentOptions(allData);
        } catch (error) {
            console.error('❌ [IntegrationArtifacts] Failed to load environments from localStorage:', error);
            setEnvironmentOptions([]);
        } finally {
            setLoadingEnvironments(false);
        }
    }, [selectedAccountId, selectedEnterpriseId, row.entity, row.product, row.service]);

    // Load environments and selected artifacts when modal opens
    useEffect(() => {
        if (isOpen) {
            loadEnvironments();
            // Load environment name and selected artifacts from localStorage
            const savedEnvironmentName = loadEnvironmentNameFromStorage();
            const savedArtifacts = loadSelectedArtifactsFromStorage();
            
            if (savedEnvironmentName) {
                setEnvironmentName(savedEnvironmentName);
            }
            
            setSelectedArtifacts(savedArtifacts);
            setOriginalSelectedArtifacts(savedArtifacts);
            prevSelectedArtifactsRef.current = savedArtifacts;
            setHasUnsavedChanges(false);
        } else {
            // Reset when modal closes
            setEnvironmentName('');
            setSelectedArtifacts([]);
            setOriginalSelectedArtifacts([]);
            prevSelectedArtifactsRef.current = [];
            setHasUnsavedChanges(false);
            setShowUnsavedChangesDialog(false);
            setArtifacts([]);
        }
    }, [isOpen, loadEnvironments, loadSelectedArtifactsFromStorage, loadEnvironmentNameFromStorage]);

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen) {
            const hasChanges = JSON.stringify([...selectedArtifacts].sort()) !== 
                             JSON.stringify([...originalSelectedArtifacts].sort());
            setHasUnsavedChanges(hasChanges);
        }
    }, [selectedArtifacts, originalSelectedArtifacts, isOpen]);

    // Ref to store handleGo for auto-load
    const handleGoRef = useRef<(() => Promise<void>) | null>(null);

    // Handle Go button click
    const handleGo = async () => {
        if (!environmentName.trim()) {
            console.log('⚠️ [IntegrationArtifacts] No environment selected');
            return;
        }

        if (!selectedAccountId || !selectedEnterpriseId) {
            console.error('⚠️ [IntegrationArtifacts] Missing account or enterprise context');
            return;
        }

        setLoadingEnvironments(true);
        try {
            console.log('🚀 [IntegrationArtifacts] Go clicked with environment:', environmentName);

            // Load environment from localStorage to get API URL and API Credential Name
            const LOCAL_STORAGE_ENVIRONMENTS_KEY = 'environments_environments_data';
            const getLocalStorageKey = (accountId: string, enterpriseId: string): string => {
                if (accountId && enterpriseId) {
                    return `${LOCAL_STORAGE_ENVIRONMENTS_KEY}_${accountId}_${enterpriseId}`;
                }
                return LOCAL_STORAGE_ENVIRONMENTS_KEY;
            };

            const storageKey = getLocalStorageKey(selectedAccountId, selectedEnterpriseId);
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
            
            if (!stored) {
                console.error('❌ [IntegrationArtifacts] No environments found in localStorage');
                setArtifacts([]);
                setSelectedArtifacts([]);
                return;
            }

            const allEnvironments: Array<{
                id: string;
                connectorName: string; // Environment Name
                entity: string;
                product: string;
                service: string;
                connectors?: Array<{
                    id: string;
                    category: string;
                    connector: string;
                    apiUrl?: string;
                    apiCredentialName?: string;
                    authenticationType?: string;
                }>;
            }> = JSON.parse(stored);

            // Find the selected environment
            const selectedEnvironment = allEnvironments.find(
                env => env.connectorName?.toLowerCase().trim() === environmentName.toLowerCase().trim() &&
                       (!row.entity || env.entity?.toLowerCase().trim() === row.entity.toLowerCase().trim()) &&
                       (!row.product || env.product?.toLowerCase().trim() === row.product.toLowerCase().trim()) &&
                       (!row.service || env.service?.toLowerCase().trim() === row.service.toLowerCase().trim())
            );

            if (!selectedEnvironment) {
                console.error('❌ [IntegrationArtifacts] Environment not found:', environmentName);
                setArtifacts([]);
                setSelectedArtifacts([]);
                return;
            }

            // Get the Cloud Foundry connector (should have API URL and API Credential Name)
            const cloudFoundryConnector = selectedEnvironment.connectors?.find(
                c => c.connector?.toLowerCase() === 'cloud foundry' && c.category?.toLowerCase() === 'deploy'
            );

            if (!cloudFoundryConnector || !cloudFoundryConnector.apiUrl || !cloudFoundryConnector.apiCredentialName) {
                console.error('❌ [IntegrationArtifacts] Environment missing API URL or API Credential Name');
                setArtifacts([]);
                setSelectedArtifacts([]);
                return;
            }

            const apiUrl = cloudFoundryConnector.apiUrl.trim();
            const apiCredentialName = cloudFoundryConnector.apiCredentialName.trim();

            // Construct the full API URL
            const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
            const fullApiUrl = `${baseUrl}/api/v1/IntegrationPackages`;

            console.log('📡 [IntegrationArtifacts] Constructed API URL:', fullApiUrl);
            console.log('🔑 [IntegrationArtifacts] API Credential Name:', apiCredentialName);

            // Load credential details from localStorage
            const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials_credentials_data';
            const credentialStorageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
            const credentialStored = typeof window !== 'undefined' ? window.localStorage.getItem(credentialStorageKey) : null;

            if (!credentialStored) {
                console.error('❌ [IntegrationArtifacts] No credentials found in localStorage');
                setArtifacts([]);
                setSelectedArtifacts([]);
                return;
            }

            const allCredentials: Array<{
                id: string;
                credentialName: string;
                entity?: string;
                product?: string;
                service?: string;
                connectors?: Array<{
                    category?: string;
                    connector?: string;
                    serviceKeyDetails?: string;
                    authenticationType?: string;
                    oauth2ClientId?: string;
                    oauth2ClientSecret?: string;
                    oauth2TokenUrl?: string;
                    username?: string;
                    apiKey?: string;
                }>;
            }> = JSON.parse(credentialStored);

            // Find the credential matching the API Credential Name
            const credential = allCredentials.find(
                cred => cred.credentialName?.toLowerCase().trim() === apiCredentialName.toLowerCase().trim() &&
                        (!row.entity || !cred.entity || cred.entity.toLowerCase().trim() === row.entity.toLowerCase().trim()) &&
                        (!row.product || !cred.product || cred.product.toLowerCase().trim() === row.product.toLowerCase().trim()) &&
                        (!row.service || !cred.service || cred.service.toLowerCase().trim() === row.service.toLowerCase().trim())
            );

            if (!credential) {
                console.error('❌ [IntegrationArtifacts] Credential not found:', apiCredentialName);
                setArtifacts([]);
                setSelectedArtifacts([]);
                return;
            }

            // Get the Cloud Foundry API connector config
            const credentialConnector = credential.connectors?.find(
                c => c.connector?.toLowerCase() === 'cloud foundry' &&
                     c.category?.toLowerCase() === 'deploy' &&
                     c.serviceKeyDetails?.toLowerCase() === 'api'
            );

            if (!credentialConnector) {
                console.error('❌ [IntegrationArtifacts] Credential connector config not found');
                setArtifacts([]);
                setSelectedArtifacts([]);
                return;
            }

            const authenticationType = credentialConnector.authenticationType || '';

            // Build payload based on authentication type
            let payload: any = {
                apiUrl: fullApiUrl,
                authenticationType,
                accountId: selectedAccountId,
                accountName: selectedAccountName,
                enterpriseId: selectedEnterpriseId,
                enterpriseName: selectedEnterprise,
                workstream: row.entity,
                product: row.product,
                service: row.service,
                environmentName: environmentName,
                credentialName: apiCredentialName,
            };

            if (authenticationType === 'OAuth2') {
                const oauth2ClientId = credentialConnector.oauth2ClientId || '';
                const oauth2ClientSecret = credentialConnector.oauth2ClientSecret || '';
                const oauth2TokenUrl = credentialConnector.oauth2TokenUrl || '';

                if (!oauth2ClientId || !oauth2ClientSecret || !oauth2TokenUrl) {
                    console.error('❌ [IntegrationArtifacts] OAuth2 credential missing required fields');
                    setArtifacts([]);
                    setSelectedArtifacts([]);
                    return;
                }

                payload = {
                    ...payload,
                    oauth2ClientId,
                    oauth2ClientSecret,
                    oauth2TokenUrl,
                };
            } else {
                // Basic Auth or other types
                const username = credentialConnector.username || '';
                const apiKey = credentialConnector.apiKey || '';

                if (!username || !apiKey) {
                    console.error('❌ [IntegrationArtifacts] Credential missing username or API key');
                    setArtifacts([]);
                    setSelectedArtifacts([]);
                    return;
                }

                payload = {
                    ...payload,
                    username,
                    apiKey,
                };
            }

            console.log('📤 [IntegrationArtifacts] Sending payload to backend:', {
                ...payload,
                oauth2ClientSecret: payload.oauth2ClientSecret ? '***' : undefined,
                apiKey: payload.apiKey ? '***' : undefined,
            });

            // Call backend API to fetch integration packages with artifacts
            const response = await api.post<{
                success: boolean;
                data?: Array<{
                    Name: string;
                    Version: string;
                    Id?: string;
                    IntegrationDesigntimeArtifacts?: Array<{
                        Name: string;
                        Version: string;
                        Id?: string;
                    }>;
                    ValueMappingDesigntimeArtifacts?: Array<{
                        Name: string;
                        Version: string;
                        Id?: string;
                    }>;
                    ScriptCollectionDesigntimeArtifacts?: Array<{
                        Name: string;
                        Version: string;
                        Id?: string;
                    }>;
                    [key: string]: any;
                }>;
                error?: string;
            }>('/api/integration-artifacts/fetch-packages', payload);

            if (response && response.success && response.data) {
                console.log('✅ [IntegrationArtifacts] Received packages:', response.data);

                // Transform response to IntegrationArtifactRow format with nested artifacts
                const transformedArtifacts: IntegrationArtifactRow[] = response.data.map((pkg, index) => {
                    const packageId = pkg.Id || `package-${Date.now()}-${index}`;
                    const syncedBy = selectedAccountName || 'System';
                    const syncedOn = new Date().toISOString();

                    // Collect all child artifacts
                    const childArtifacts: IntegrationArtifactRow[] = [];

                    // Add IntegrationDesigntimeArtifacts (IFLOW)
                    if (pkg.IntegrationDesigntimeArtifacts && Array.isArray(pkg.IntegrationDesigntimeArtifacts)) {
                        pkg.IntegrationDesigntimeArtifacts.forEach((iflow, iflowIndex) => {
                            childArtifacts.push({
                                id: iflow.Id || `iflow-${packageId}-${iflowIndex}`,
                                artifactName: iflow.Name || 'N/A',
                                type: 'IFLOW',
                                version: iflow.Version || 'N/A',
                                syncedBy,
                                syncedOn,
                                isPackage: false,
                            });
                        });
                    }

                    // Add ValueMappingDesigntimeArtifacts (VALUE MAPPING)
                    if (pkg.ValueMappingDesigntimeArtifacts && Array.isArray(pkg.ValueMappingDesigntimeArtifacts)) {
                        pkg.ValueMappingDesigntimeArtifacts.forEach((vm, vmIndex) => {
                            childArtifacts.push({
                                id: vm.Id || `vm-${packageId}-${vmIndex}`,
                                artifactName: vm.Name || 'N/A',
                                type: 'VALUE MAPPING',
                                version: vm.Version || 'N/A',
                                syncedBy,
                                syncedOn,
                                isPackage: false,
                            });
                        });
                    }

                    // Add ScriptCollectionDesigntimeArtifacts (SCRIPT COLLECTION)
                    if (pkg.ScriptCollectionDesigntimeArtifacts && Array.isArray(pkg.ScriptCollectionDesigntimeArtifacts)) {
                        pkg.ScriptCollectionDesigntimeArtifacts.forEach((sc, scIndex) => {
                            childArtifacts.push({
                                id: sc.Id || `sc-${packageId}-${scIndex}`,
                                artifactName: sc.Name || 'N/A',
                                type: 'SCRIPT COLLECTION',
                                version: sc.Version || 'N/A',
                                syncedBy,
                                syncedOn,
                                isPackage: false,
                            });
                        });
                    }

                    return {
                        id: packageId,
                        artifactName: pkg.Name || 'N/A',
                        type: 'PACKAGE',
                        version: pkg.Version || 'N/A',
                        syncedBy,
                        syncedOn,
                        isPackage: true,
                        artifacts: childArtifacts,
                    };
                });

                setArtifacts(transformedArtifacts);
                // Restore saved selections from localStorage instead of clearing
                const savedSelections = loadSelectedArtifactsFromStorage();
                setSelectedArtifacts(savedSelections);
                setOriginalSelectedArtifacts(savedSelections);
                prevSelectedArtifactsRef.current = savedSelections;
                console.log('✅ [IntegrationArtifacts] Artifacts loaded:', transformedArtifacts.length, 'packages with', 
                    transformedArtifacts.reduce((sum, pkg) => sum + (pkg.artifacts?.length || 0), 0), 'total artifacts');
                console.log('✅ [IntegrationArtifacts] Restored', savedSelections.length, 'saved selections');
            } else {
                console.error('❌ [IntegrationArtifacts] Failed to fetch packages:', response?.error);
                setArtifacts([]);
                setSelectedArtifacts([]);
            }
        } catch (error: any) {
            console.error('❌ [IntegrationArtifacts] Error fetching packages:', error);
            setArtifacts([]);
            setSelectedArtifacts([]);
        } finally {
            setLoadingEnvironments(false);
        }
    };

    // Store handleGo in ref for auto-load
    handleGoRef.current = handleGo;

    // Auto-load artifacts when environment name is restored and environments are loaded
    useEffect(() => {
        if (isOpen && environmentName && environmentOptions.length > 0 && artifacts.length === 0 && !loadingEnvironments) {
            // Only auto-load if we have a saved environment name and no artifacts loaded yet
            console.log('🔄 [IntegrationArtifacts] Auto-loading artifacts for saved environment:', environmentName);
            // Use a small delay to ensure environments are fully loaded
            const timer = setTimeout(() => {
                if (handleGoRef.current) {
                    handleGoRef.current();
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, environmentName, environmentOptions.length, artifacts.length, loadingEnvironments]);

    // Handle delete artifact
    const handleDeleteArtifact = useCallback((id: string) => {
        console.log('🗑️ [IntegrationArtifacts] Delete artifact:', id);
        setArtifacts((prev) => prev.filter((artifact) => artifact.id !== id));
        // TODO: Implement API call to delete artifact
    }, []);

    // Handle save
    const handleSave = async () => {
        console.log('💾 Save button clicked');
        setIsSaving(true);
        try {
            // Save selected artifacts and environment name to localStorage
            saveSelectedArtifactsToStorage(selectedArtifacts);
            if (environmentName) {
                saveEnvironmentNameToStorage(environmentName);
            }
            
            // Update original selections to mark as saved
            setOriginalSelectedArtifacts(selectedArtifacts);
            setHasUnsavedChanges(false);
            
            // TODO: Implement save logic (API call)
            if (onSave) {
                onSave();
            }
            console.log('✅ Save completed');
            
            // Close the modal after successful save
            onClose();
        } catch (error) {
            console.error('❌ Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle selection change
    const handleSelectionChange = useCallback((selectedIds: string[]) => {
        console.log('📋 [IntegrationArtifacts] Selection changed:', selectedIds.length, 'artifacts selected');
        setSelectedArtifacts(selectedIds);
        prevSelectedArtifactsRef.current = selectedIds;
    }, []);

    // Handle close with unsaved changes check
    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedChangesDialog(true);
        } else {
            onClose();
        }
    };

    // Handle discard changes
    const handleDiscardChanges = () => {
        // Reload original selections
        setSelectedArtifacts(originalSelectedArtifacts);
        setHasUnsavedChanges(false);
        setShowUnsavedChangesDialog(false);
        onClose();
    };

    // Handle keep editing
    const handleKeepEditing = () => {
        setShowUnsavedChangesDialog(false);
    };

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isTopLevelModal) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, isTopLevelModal]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 overflow-hidden ${!isTopLevelModal ? 'pointer-events-none' : ''}`}
            style={{ zIndex: overlayZIndex }}
        >
            {/* Backdrop */}
            {isTopLevelModal && (
                <div 
                    className="absolute inset-0 bg-black bg-opacity-50"
                    onClick={handleClose}
                />
            )}
            
            {/* Modal Panel */}
            <motion.div 
                className="absolute right-0 top-0 h-screen shadow-2xl border-l border-gray-200 flex overflow-hidden pointer-events-auto bg-white"
                style={{ width: `${modalWidth}px` }}
                ref={modalRef}
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
                    
                    {/* Middle Text - Rotated and Bold */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
                        <div className="flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide">
                            <Layers className="h-4 w-4" />
                            <span>Integration Artifacts</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white overflow-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-base">Integration Artifacts</p>
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
                        
                        {/* Job Info */}
                        <div className="mt-4 flex gap-3">
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">Job Name</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{row.connectorName || '\u00A0'}</div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="text-blue-100 text-sm font-medium mb-1">Description</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{row.description || '\u00A0'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left side - Search Bar */}
                            <div className="flex items-center gap-4">
                                {/* Global Search - Match AssignedUserGroupModal exactly */}
                                <div className='flex items-center'>
                                    <div className='relative w-60'>
                                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                            <MagnifyingGlassIcon className='h-5 w-5 text-secondary' />
                                        </div>
                                        <input
                                            type='text'
                                            placeholder='Global Search'
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setAppliedSearchTerm(e.target.value);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    setAppliedSearchTerm(searchTerm);
                                                }
                                            }}
                                            className='search-placeholder block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm'
                                            style={{ fontSize: '14px' }}
                                        />
                                        {appliedSearchTerm && (
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setAppliedSearchTerm('');
                                                }}
                                                className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
                                                title='Clear search'
                                            >
                                                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Environment Name and Go Button */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                        Environment Name:
                                    </label>
                                    <div className="min-w-[200px]">
                                        <EnvironmentNameDropdown
                                            value={environmentName}
                                            onChange={(newValue) => setEnvironmentName(newValue)}
                                            disabled={loadingEnvironments}
                                            isError={false}
                                            placeholder="Select environment name..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleGo}
                                        disabled={!environmentName.trim() || loadingEnvironments}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loadingEnvironments ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                <span>Loading...</span>
                                            </>
                                        ) : (
                                            <span>Go</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Right side - Save Button */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className={`flex items-center space-x-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ${
                                        isSaving 
                                            ? 'bg-blue-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    <BookmarkIcon className="h-4 w-4" />
                                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex flex-col p-4">
                        {environmentName ? (
                            <IntegrationArtifactsTable
                                artifacts={artifacts}
                                onDelete={handleDeleteArtifact}
                                searchQuery={appliedSearchTerm}
                                selectedArtifacts={selectedArtifacts}
                                onSelectionChange={handleSelectionChange}
                                disabled={hasBuildTriggered()}
                            />
                        ) : (
                            <div className="text-gray-500 text-center py-8 flex-1 flex items-center justify-center">
                                Select an environment and click Go to view integration artifacts.
                            </div>
                        )}
                    </div>
                </div>

                {/* Unsaved Changes Confirmation Dialog */}
                <AnimatePresence>
                    {showUnsavedChangesDialog && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10060] flex items-center justify-center p-4"
                        >
                            <div className="absolute inset-0 bg-black bg-opacity-60" onClick={handleKeepEditing} />
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
            </motion.div>
        </div>
    );
};

export default IntegrationArtifactsModal;

