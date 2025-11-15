import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Plus, Users, Save, XCircle, Shield } from 'lucide-react';
import { BookmarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { generateId } from '@/utils/id-generator';
import { api } from '@/utils/api';
import AssignedUserRoleTable from './AssignedUserRoleTable';
import ScopeConfigModal from './ScopeConfigModal';

export interface UserRole {
    id: string;
    roleId?: string;
    roleName: string;
    description: string;
    entity: string;
    product: string;
    service: string;
    scope: string;
    isFromDatabase?: boolean; // Flag to indicate if this is an existing role from database (fields should be read-only)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const roleNameLooksLikeId = (value?: string | null) =>
    typeof value === 'string' && UUID_REGEX.test(value.trim());

interface AssignedUserRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userRoles: UserRole[]) => void;
    groupName: string;
    groupDescription: string;
    groupId?: string;
    initialUserRoles?: UserRole[];
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    stackLevel?: number;
    availableRoles?: UserRole[];
}

const AssignedUserRoleModal: React.FC<AssignedUserRoleModalProps> = ({
    isOpen,
    onClose,
    onSave,
    groupName,
    groupDescription,
    groupId,
    initialUserRoles = [],
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
    stackLevel = 1,
    availableRoles = []
}) => {
    // State management
    const [userRoles, setUserRoles] = useState<UserRole[]>([]);
    const [selectedUserRoles, setSelectedUserRoles] = useState<UserRole[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // Applied search term
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [originalUserRoles, setOriginalUserRoles] = useState<UserRole[]>([]);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // For save operation
    const [availableGroups, setAvailableGroups] = useState<UserRole[]>([]); // All available groups from database with full details
    const [isLoadingData, setIsLoadingData] = useState(false); // For initial data load
    const [showScopeModal, setShowScopeModal] = useState(false);
    const [selectedRoleForScope, setSelectedRoleForScope] = useState<UserRole | null>(null);
    
    const modalRef = useRef<HTMLDivElement | null>(null);

    const PANEL_BASE_WIDTH = 920;
    const SIDE_PANEL_WIDTH = 40;
    const MIN_PANEL_WIDTH = 640;
    const normalizedStackLevel = Math.max(0, stackLevel);
    const panelOffset = Math.min(normalizedStackLevel * SIDE_PANEL_WIDTH, PANEL_BASE_WIDTH - MIN_PANEL_WIDTH);
    const modalWidth = PANEL_BASE_WIDTH - panelOffset;
    const overlayZIndex = 10000 + normalizedStackLevel;
    const isTopLevelModal = normalizedStackLevel === 0;

    const normalizeRoleRecords = useCallback((roles: any[]): UserRole[] => {
        if (!Array.isArray(roles)) return [];
        return roles
            .map((role: any): UserRole | null => {
                const roleName = (role?.roleName || role?.name || '').trim();
                if (!roleName) {
                    return null;
                }
                return {
                    id: role?.id?.toString() || generateId(),
                    roleId: role?.roleId?.toString() || role?.id?.toString(),
                    roleName,
                    description: role?.description || '',
                    entity: role?.entity || '',
                    product: role?.product || '',
                    service: role?.service || '',
                    scope: role?.scope || '',
                    isFromDatabase: role?.isFromDatabase ?? true,
                };
            })
            .filter((role): role is UserRole => Boolean(role));
    }, []);

    // Track if data has been loaded for this modal session
    const dataLoadedRef = useRef(false);
    
    // Track if we've ever fetched from API for this user (across all modal opens)
    const hasEverFetchedFromAPIRef = useRef(false);
    const roleIdCacheRef = useRef<Map<string, string>>(new Map());
    
    // Track the current groupId to detect when it changes (different user)
    const lastUserIdRef = useRef<string | undefined>(groupId);
    
    // Reset hasEverFetchedFromAPIRef when groupId changes (opening modal for different user)
    useEffect(() => {
        if (groupId !== lastUserIdRef.current) {
            console.log('🔄 groupId changed from', lastUserIdRef.current, 'to', groupId, '- resetting hasEverFetchedFromAPIRef');
            hasEverFetchedFromAPIRef.current = false;
            lastUserIdRef.current = groupId;
        }
    }, [groupId]);

    // Load assigned roles from database when modal opens
    const loadUserRoles = useCallback(async () => {
        if (!isOpen) return;
        
        console.log('🔄 loadUserRoles called, loading data...');
        console.log('🔍 dataLoadedRef.current:', dataLoadedRef.current);
        console.log('🔍 initialUserRoles:', initialUserRoles);
        
        // Set loading state
        setIsLoadingData(true);
        
        try {
            // Check if group ID is temporary (group not yet saved to database)
            const isTemporaryGroup = groupId?.startsWith('tmp-');
            console.log('📂 Loading assigned roles, groupId:', groupId, 'isTemporary:', isTemporaryGroup);
            
            if (isTemporaryGroup) {
                // For temporary groups, use initialUserRoles from parent state
                console.log('📦 Using initialUserRoles for temporary group:', initialUserRoles);
                setUserRoles(initialUserRoles);
                setSelectedUserRoles(initialUserRoles);
                setOriginalUserRoles(JSON.parse(JSON.stringify(initialUserRoles)));
                return;
            }
            
            // groupId is always provided for saved groups
            let actualGroupId = groupId;
            
            if (actualGroupId && !actualGroupId.startsWith('tmp-')) {
                // Data loading strategy:
                // 1. On FIRST OPEN (never fetched before): Fetch from API to get initial database state
                // 2. On SUBSEQUENT OPENS: Use parent state as source of truth (may be empty if user deleted all)
                console.log('📦 initialUserRoles from parent (length:', initialUserRoles.length, '):', initialUserRoles);
                console.log('📦 hasEverFetchedFromAPIRef:', hasEverFetchedFromAPIRef.current);
                
                let finalGroups = initialUserRoles;
                
                // Check if initialUserRoles contains strings (role IDs) instead of objects
                const hasStringIds = initialUserRoles.length > 0 && typeof initialUserRoles[0] === 'string';
                console.log('🔍 initialUserRoles contains string IDs?', hasStringIds);

                const rolesNeedHydration = initialUserRoles.some((role: any) => {
                    if (typeof role !== 'object' || role === null) {
                        return false;
                    }
                    
                    const roleName = role.roleName?.trim() || '';
                    const matchesRoleId =
                        roleName.length > 0 &&
                        role.roleId &&
                        roleName.toLowerCase() === role.roleId.toLowerCase();
                    const looksLikeUuid = roleNameLooksLikeId(roleName);
                    const missingName = roleName.length === 0;
                    const missingDetails = !role.description && !role.entity && !role.product && !role.service;
                    
                    return matchesRoleId || looksLikeUuid || missingName || missingDetails;
                });
                console.log('🔍 initialUserRoles need hydration?', rolesNeedHydration);
                
                // Only fetch from API if:
                // 1. Parent state is empty (or not yet populated)
                // 2. OR parent state contains string IDs or incomplete role objects (need to fetch full role objects)
                // 3. AND we've never fetched from API before (first time opening modal)
                const shouldFetchFromAPI = (initialUserRoles.length === 0 || hasStringIds || rolesNeedHydration) && !hasEverFetchedFromAPIRef.current;
                
                if (shouldFetchFromAPI) { // Fetch from API on first open only
                    console.log('⚠️ initialUserRoles is empty or contains string IDs, fetching from API...');
                    try {
                        // Build query parameters for fetching assigned roles
                        const queryParams = new URLSearchParams();
                        if (selectedAccountId) queryParams.append('accountId', selectedAccountId);
                        if (selectedAccountName) queryParams.append('accountName', selectedAccountName);
                        if (selectedEnterpriseId) queryParams.append('enterpriseId', selectedEnterpriseId);
                        if (selectedEnterprise) queryParams.append('enterpriseName', selectedEnterprise);
                        
                        const apiUrl = `/api/user-management/groups/${actualGroupId}/roles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
                        console.log('🌐 [API Call] Fetching assigned roles from:', apiUrl);
                        
                        // Fetch assigned roles for this group
                        const response = await api.get<any>(apiUrl);
                        console.log('📦 Loaded assigned roles from database:', response);
                        console.log('📦 Response type:', typeof response, 'Is array:', Array.isArray(response));
                        
                        // Handle response structure - could be direct array or {success: true, data: [...]} or {success: true, data: {roles: [...]}}
                        let rolesData = response;
                        if (response && typeof response === 'object' && 'data' in response) {
                            console.log('📦 Response has data property, extracting...', response.data);
                            rolesData = response.data;
                            
                            // Check if data has a nested roles property
                            if (rolesData && typeof rolesData === 'object' && 'roles' in rolesData) {
                                console.log('📦 Data has roles property, extracting...', rolesData.roles);
                                rolesData = rolesData.roles;
                            }
                        }
                        
                        console.log('📦 Final rolesData:', rolesData, 'Is array:', Array.isArray(rolesData));
                        
                        if (rolesData && Array.isArray(rolesData) && rolesData.length > 0) {
                            // Convert API response to UserRole format
                            // IMPORTANT: Always generate a new unique ID for each group-role assignment
                            // to avoid duplicate key issues (group can have same role assigned multiple times)
                            const loadedRoles: UserRole[] = rolesData.map((role: any) => ({
                                id: generateId(), // Always generate unique ID for this assignment
                                roleId: role.id?.toString() || role.roleId?.toString(),
                                roleName: role.name || role.roleName || '',
                                description: role.description || '',
                                entity: role.entity || '',
                                product: role.product || '',
                                service: role.service || '',
                                scope: role.scope || '',
                                isFromDatabase: true // Mark as from database since it's an existing assignment
                            }));
                            
                            console.log('✅ Loaded and parsed assigned roles from API:', loadedRoles);
                            console.log('✅ Unique IDs generated:', loadedRoles.map(r => r.id));
                            finalGroups = loadedRoles;
                            
                            // Mark that we've fetched from API (don't fetch again on subsequent opens)
                            hasEverFetchedFromAPIRef.current = true;
                            console.log('✅ Set hasEverFetchedFromAPIRef to true');
                        } else {
                            console.log('⚠️ API returned no valid data, using initialUserRoles');
                            // Still mark as fetched to avoid trying again
                            hasEverFetchedFromAPIRef.current = true;
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not load assigned roles from database, using initialUserRoles:', error);
                        // Mark as fetched even on error to avoid retry loops
                        hasEverFetchedFromAPIRef.current = true;
                    }
                } else {
                    console.log('✅ Using initialUserRoles from parent as source of truth (length:', initialUserRoles.length, ')');
                    // Already fetched before OR parent has data, so mark as fetched
                    if (!hasEverFetchedFromAPIRef.current) {
                        hasEverFetchedFromAPIRef.current = true;
                        console.log('✅ Set hasEverFetchedFromAPIRef to true (using parent state)');
                    }
                }
                
                // Filter out any string IDs that might have slipped through
                const validRoles = finalGroups.filter((role: any) => {
                    if (typeof role === 'string') {
                        console.warn('⚠️ Filtering out string ID from userRoles:', role);
                        return false;
                    }
                    return typeof role === 'object' && role !== null;
                });
                
                if (validRoles.length !== finalGroups.length) {
                    console.log('🧹 Filtered out', finalGroups.length - validRoles.length, 'invalid entries');
                }
                
                // Set the final groups
                console.log('💾 Setting userRoles to validRoles (length:', validRoles.length, '):', validRoles);
                setUserRoles(validRoles);
                setSelectedUserRoles(validRoles);
                setOriginalUserRoles(JSON.parse(JSON.stringify(validRoles)));
            } else {
                // No groupId or temporary user, use initialUserRoles
                console.log('📦 No valid user ID, using initialUserRoles');
                setUserRoles(initialUserRoles);
                setSelectedUserRoles(initialUserRoles);
                setOriginalUserRoles(JSON.parse(JSON.stringify(initialUserRoles)));
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
            setUserRoles(initialUserRoles);
            setSelectedUserRoles(initialUserRoles);
            setOriginalUserRoles(JSON.parse(JSON.stringify(initialUserRoles)));
        } finally {
            // Clear loading state
            setIsLoadingData(false);
        }
        
        console.log('✅ loadUserRoles complete, data loaded successfully');
    }, [isOpen, groupId, initialUserRoles, selectedAccountId, selectedAccountName, selectedEnterpriseId, selectedEnterprise]);

    // Load all available roles from database filtered by account and enterprise
    const loadAllAvailableGroups = useCallback(async () => {
        console.log('🔄 Loading available roles from database with filters...');
        console.log('🔍 Account/Enterprise context:', {
            selectedAccountId,
            selectedAccountName,
            selectedEnterprise,
            selectedEnterpriseId
        });
        
        try {
            if (availableRoles && availableRoles.length > 0) {
                console.log('📦 Using provided availableRoles prop:', availableRoles.length);
                const normalized = normalizeRoleRecords(availableRoles);
                setAvailableGroups(normalized);
                return normalized;
            }

            // Build query parameters with account and enterprise filters - exactly like Manage User Roles
            const queryParams = new URLSearchParams();
            if (selectedAccountId) queryParams.append('accountId', selectedAccountId);
            if (selectedAccountName) queryParams.append('accountName', selectedAccountName);
            if (selectedEnterpriseId) queryParams.append('enterpriseId', selectedEnterpriseId);
            if (selectedEnterprise) queryParams.append('enterpriseName', selectedEnterprise);
            
            const apiUrl = `/api/user-management/roles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            console.log('🌐 [API Call] Making request to:', apiUrl);
            
            const response = await api.get<any>(apiUrl);
            console.log('📦 Filtered roles response:', response);
            
            // Handle response structure
            let rolesData = response;
            if (response && typeof response === 'object' && 'data' in response) {
                rolesData = response.data;
                if (rolesData && typeof rolesData === 'object' && 'roles' in rolesData) {
                    rolesData = rolesData.roles;
                }
            }
            
            if (rolesData && Array.isArray(rolesData)) {
                const formattedRoles: UserRole[] = normalizeRoleRecords(rolesData);
                
                setAvailableGroups(formattedRoles);
                console.log('✅ Loaded and cached', formattedRoles.length, 'available roles');
                return formattedRoles;
            } else {
                console.log('⚠️ No roles data found');
                setAvailableGroups([]);
                return [];
            }
        } catch (error) {
            console.warn('⚠️ Could not load available roles:', error);
            setAvailableGroups([]);
            return [];
        }
    }, [availableRoles, normalizeRoleRecords, selectedAccountId, selectedAccountName, selectedEnterprise, selectedEnterpriseId]);

    const buildBaseQueryParams = useCallback(() => {
        const queryParams = new URLSearchParams();
        if (selectedAccountId) queryParams.append('accountId', selectedAccountId);
        if (selectedAccountName) queryParams.append('accountName', selectedAccountName);
        if (selectedEnterpriseId) queryParams.append('enterpriseId', selectedEnterpriseId);
        if (selectedEnterprise) queryParams.append('enterpriseName', selectedEnterprise);
        return queryParams;
    }, [selectedAccountId, selectedAccountName, selectedEnterpriseId, selectedEnterprise]);

    const buildContextQueryString = useCallback(() => {
        const params = buildBaseQueryParams();
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }, [buildBaseQueryParams]);

    const fetchExistingRoleId = useCallback(async (roleName: string): Promise<string | null> => {
        const normalizedName = roleName?.trim().toLowerCase();
        if (!normalizedName) {
            return null;
        }

        if (roleIdCacheRef.current.has(normalizedName)) {
            return roleIdCacheRef.current.get(normalizedName)!;
        }

        const queryParams = buildBaseQueryParams();
        queryParams.append('name', roleName.trim());

        try {
            const response = await api.get<any>(`/api/user-management/roles?${queryParams.toString()}`);
            let rolesArray = response;
            if (response && typeof response === 'object' && 'data' in response) {
                rolesArray = response.data;
                if (rolesArray && typeof rolesArray === 'object' && 'roles' in rolesArray) {
                    rolesArray = rolesArray.roles;
                }
            }

            if (rolesArray && Array.isArray(rolesArray) && rolesArray.length > 0) {
                const exactMatch = rolesArray.find((r: any) =>
                    (r.name || r.roleName || '').toLowerCase() === normalizedName
                );
                if (exactMatch?.id) {
                    const idStr = exactMatch.id.toString();
                    roleIdCacheRef.current.set(normalizedName, idStr);
                    return idStr;
                }
            }
        } catch (error) {
            console.log('ℹ️ Error checking for existing role:', error);
        }

        return null;
    }, [buildBaseQueryParams]);

    useEffect(() => {
        if (availableRoles && availableRoles.length > 0) {
            const normalized = normalizeRoleRecords(availableRoles);
            setAvailableGroups(normalized);
        }
    }, [availableRoles, normalizeRoleRecords]);

    const parseScopeValue = useCallback((scopeValue?: string) => {
        if (!scopeValue) return undefined;
        try {
            return JSON.parse(scopeValue);
        } catch {
            return scopeValue;
        }
    }, []);

    // Track modal open state to detect when it transitions from closed to open
    const prevIsOpenRef = useRef(false);
    
    // Reset when modal opens/closes
    useEffect(() => {
        // Check if modal is transitioning from closed to open (true opening, not just re-render)
        const isModalOpening = isOpen && !prevIsOpenRef.current;
        
        console.log('🔍 Modal state change - isOpen:', isOpen, 'isModalOpening:', isModalOpening, 'dataLoadedRef:', dataLoadedRef.current);
        
        if (isOpen) {
            // Only load data when the modal is truly opening (not on re-renders)
            if (isModalOpening) {
                console.log('🔄 Modal is truly opening, loading data...');
                
                // Reset fetch flag to allow fresh data loading
                hasEverFetchedFromAPIRef.current = false;
                roleIdCacheRef.current.clear();
                console.log('🔄 Reset hasEverFetchedFromAPIRef to false for fresh data load');
                
                // Reset UI state
                setSearchTerm('');
                setAppliedSearchTerm('');
                setHasUnsavedChanges(false);
                setValidationErrors(new Set());
                setShowValidationErrors(false);
                
                // Set flag to prevent double-loading in React Strict Mode
                if (!dataLoadedRef.current) {
                    dataLoadedRef.current = true;
                    console.log('📞 Calling loadUserRoles and loadAllAvailableGroups');
                    loadUserRoles();
                    loadAllAvailableGroups();
                }
            } else {
                console.log('⏭️ Modal re-rendered while open, skipping data load');
            }
        } else {
            // Reset the flag and loading state when modal closes
            console.log('🚪 Modal closing, resetting data loaded flag and loading state');
            dataLoadedRef.current = false;
            hasEverFetchedFromAPIRef.current = false;
            roleIdCacheRef.current.clear();
            setIsLoadingData(false);
            // Clear auto-filled groups tracking for next modal session
            autoFilledGroupsRef.current.clear();
            console.log('🧹 Cleared auto-filled groups tracking and API fetch flag');
        }
        
        // Update the previous open state
        prevIsOpenRef.current = isOpen;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // Only depend on isOpen, not loadUserRoles, to prevent re-triggering on re-renders

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen && originalUserRoles.length >= 0) {
            const hasChanges = JSON.stringify(selectedUserRoles.map(g => g.id).sort()) !== 
                             JSON.stringify(originalUserRoles.map(g => g.id).sort());
            setHasUnsavedChanges(hasChanges);
        }
    }, [selectedUserRoles, originalUserRoles, isOpen]);

    // Check if a group has all mandatory fields filled
    const isRoleComplete = (group: UserRole): boolean => {
        const complete = !!(
            group.roleName?.trim() &&
            group.entity?.trim() &&
            group.product?.trim() &&
            group.service?.trim()
        );
        console.log('🔍 isRoleComplete check:', {
            groupId: group.id,
            roleName: group.roleName || '(empty)',
            entity: group.entity || '(empty)',
            product: group.product || '(empty)',
            service: group.service || '(empty)',
            complete
        });
        return complete;
    };

    // Check if the last group is complete (to allow adding new row) - memoized for reactivity
    const canAddNewRow = useMemo((): boolean => {
        if (userRoles.length === 0) return true;
        const lastGroup = userRoles[userRoles.length - 1];
        return isRoleComplete(lastGroup);
    }, [userRoles]);

    // Store reference to track which groups have been auto-filled to prevent re-processing
    const autoFilledGroupsRef = useRef<Set<string>>(new Set());
    
    // Handle user role updates with auto-population for existing roles
    const handleUpdateUserRoles = useCallback((updatedGroups: UserRole[]) => {
        console.log('🔄 handleUpdateUserRoles called with:', updatedGroups);
        console.log('📋 Available roles in cache:', availableGroups.length);
        console.log('📋 Auto-filled roles ref:', Array.from(autoFilledGroupsRef.current));
        
        // Process each group to see if it matches a cached group
        const groupsWithAutoFill = updatedGroups.map((group) => {
            console.log('🔍 Processing group in handleUpdateUserRoles:', {
                id: group.id,
                roleName: group.roleName,
                isFromDatabase: group.isFromDatabase,
                entity: group.entity,
                product: group.product
            });
            
            // If roleName is empty, clear all auto-populated fields and mark as not auto-filled
            if (!group.roleName.trim()) {
                console.log('🧹 Group name is empty, clearing all fields for group:', group.id);
                autoFilledGroupsRef.current.delete(group.id); // Remove from auto-filled set
                return {
                    ...group,
                    roleId: undefined,
                    roleName: '',
                    description: '',
                    entity: '',
                    product: '',
                    service: '',
                    scope: '',
                    isFromDatabase: false // Mark as not from database (editable)
                };
            }
            
            // Skip if already marked as from database (don't re-process)
            if (group.isFromDatabase) {
                console.log('⏭️ Skipping auto-fill for database group:', group.roleName, 'Returning as-is');
                return group;
            }
            
            // Check if this group has already been auto-filled
            // If yes, don't overwrite user's manual changes
            if (autoFilledGroupsRef.current.has(group.id)) {
                console.log('⏭️ Group already auto-filled, preserving user changes:', group.roleName);
                return group; // Return as-is to preserve user's manual edits
            }
            
            // Check cache (availableGroups) for matching group
            const cachedGroup = availableGroups.find(
                ag => ag.roleName.toLowerCase() === group.roleName.trim().toLowerCase()
            );
            
            if (cachedGroup) {
                console.log('✅ Auto-populating from cache for existing role:', cachedGroup.roleName);
                console.log('📋 Cached role details:', {
                    description: cachedGroup.description,
                    entity: cachedGroup.entity,
                    product: cachedGroup.product,
                    service: cachedGroup.service,
                    scope: cachedGroup.scope
                });
                
                // Check if the cached role has all mandatory fields filled
                const isCachedGroupComplete = !!(
                    cachedGroup.entity?.trim() &&
                    cachedGroup.product?.trim() &&
                    cachedGroup.service?.trim()
                );
                
                console.log('🔍 Is cached role complete?', isCachedGroupComplete, {
                    entity: cachedGroup.entity || '(empty)',
                    product: cachedGroup.product || '(empty)',
                    service: cachedGroup.service || '(empty)'
                });
                
                // Mark this role as auto-filled to prevent overwriting user changes
                autoFilledGroupsRef.current.add(group.id);
                console.log('✅ Marked role as auto-filled:', group.id);
                
                // Auto-populate all fields from the cached role
                return {
                    ...group,
                    roleId: cachedGroup.roleId,
                    roleName: cachedGroup.roleName,
                    description: cachedGroup.description,
                    entity: cachedGroup.entity,
                    product: cachedGroup.product,
                    service: cachedGroup.service,
                    scope: cachedGroup.scope,
                    // Mark as from database ONLY if all mandatory fields are complete
                    // If incomplete, keep editable so user can fill in the missing fields
                    isFromDatabase: isCachedGroupComplete
                };
            }
            
            // Not in cache, treat as new custom role
            console.log('ℹ️ Role not found in cache, treating as new custom role:', group.roleName);
            return group;
        });
        
        setUserRoles(groupsWithAutoFill);
    }, [availableGroups]);

    const handleOpenScopeModal = useCallback((role: UserRole) => {
        setSelectedRoleForScope(role);
        setShowScopeModal(true);
    }, []);

    const handleCloseScopeModal = useCallback(() => {
        setShowScopeModal(false);
        setSelectedRoleForScope(null);
    }, []);

    const handleScopeSave = useCallback((scopeConfig: any) => {
        if (!selectedRoleForScope) {
            return;
        }

        const serializedScope =
            typeof scopeConfig === 'string' ? scopeConfig : JSON.stringify(scopeConfig);

        setUserRoles((prev) =>
            prev.map((role) =>
                role.id === selectedRoleForScope.id ? { ...role, scope: serializedScope } : role
            )
        );

        setSelectedUserRoles((prev) =>
            prev.map((role) =>
                role.id === selectedRoleForScope.id ? { ...role, scope: serializedScope } : role
            )
        );

        setHasUnsavedChanges(true);
        handleCloseScopeModal();
    }, [selectedRoleForScope, handleCloseScopeModal]);

    // Add new user group - called from toolbar button or Add New Row button
    const addNewUserRole = () => {
        console.log('➕ Add new role called');
        console.log('📊 Current userRoles:', userRoles);
        console.log('🔍 canAddNewRow value:', canAddNewRow);
        console.log('🔍 userRoles.length:', userRoles.length);
        
        if (userRoles.length > 0) {
            const lastGroup = userRoles[userRoles.length - 1];
            console.log('📋 Last group:', lastGroup);
            console.log('✓ isRoleComplete(lastGroup):', isRoleComplete(lastGroup));
        }
        
        // Validate that previous row is complete
        if (canAddNewRow === false) {
            console.log('❌ Cannot add new row - previous row incomplete');
            // Highlight validation errors for incomplete row
            setShowValidationErrors(true);
            const incompleteGroupId = userRoles[userRoles.length - 1]?.id;
            if (incompleteGroupId) {
                setValidationErrors(new Set([incompleteGroupId]));
            }
            return;
        }
        
        console.log('✅ Adding new role row');
        const newGroup: UserRole = {
            id: generateId(),
            roleId: undefined,
            roleName: '',
            description: '',
            entity: '',
            product: '',
            service: '',
            scope: ''
        };
        console.log('🆕 New group created:', newGroup);
        setUserRoles(prev => {
            const updated = [...prev, newGroup];
            console.log('📝 Updated userRoles:', updated);
            return updated;
        });
        // Clear validation errors when adding a valid new row
        setValidationErrors(new Set());
        setShowValidationErrors(false);
        setHasUnsavedChanges(true);
    };

    // Validate all groups before saving
    const validateAllGroups = (): boolean => {
        const incompleteGroups: string[] = [];
        let hasAtLeastOneCompleteGroup = false;
        
        userRoles.forEach(group => {
            // Check if group has any data entered
            const hasAnyData = !!(
                group.roleName?.trim() ||
                group.entity?.trim() ||
                group.product?.trim() ||
                group.service?.trim() ||
                group.description?.trim() ||
                group.scope?.trim()
            );
            
            // Check if group is complete
            const groupComplete = isRoleComplete(group);
            
            if (groupComplete) {
                hasAtLeastOneCompleteGroup = true;
            }
            
            // If group has any data but is not complete, mark as incomplete
            if (hasAnyData && !groupComplete) {
                incompleteGroups.push(group.id);
            }
        });
        
        // If there are incomplete groups, show validation errors
        if (incompleteGroups.length > 0) {
            setValidationErrors(new Set(incompleteGroups));
            setShowValidationErrors(true);
            return false;
        }
        
        // If no complete groups at all, highlight all rows with empty mandatory fields
        if (!hasAtLeastOneCompleteGroup && userRoles.length > 0) {
            // Mark all rows as needing validation
            const allGroupIds = userRoles.map(g => g.id);
            setValidationErrors(new Set(allGroupIds));
            setShowValidationErrors(true);
            return false;
        }
        
        setValidationErrors(new Set());
        setShowValidationErrors(false);
        return true;
    };

    const handleSave = async () => {
        console.log('💾 Save button clicked');
        console.log('📊 Current userRoles:', userRoles);
        
        // Validate all roles first
        if (!validateAllGroups()) {
            console.log('❌ Validation failed - mandatory fields highlighted in red');
            return;
        }

        console.log('✅ Validation passed, proceeding to save');
        setIsSaving(true);
        const roleIdByLocalId = new Map<string, string>();
        try {
            // Get actual groupId
            let actualGroupId = groupId;
            if (!actualGroupId) {
                console.warn('⚠️ No groupId provided');
            }

            // Check if group ID is temporary (group not yet saved to database)
            const isTemporaryGroup = actualGroupId?.startsWith('tmp-');
            console.log('🔍 Group ID check:', { actualGroupId, isTemporaryGroup });

            if (actualGroupId && !isTemporaryGroup) {
                const roleIdsToAssign: string[] = [];
                const normalizedOriginalRoleNames = new Set<string>();
                originalUserRoles.forEach(role => {
                    const normalized = role.roleName?.trim().toLowerCase();
                    if (normalized && role.isFromDatabase) {
                        normalizedOriginalRoleNames.add(normalized);
                    }
                });
                const normalizedCurrentRoleNames = new Set<string>();
                
                // Filter out incomplete roles - only process complete roles
                const completeRoles = userRoles.filter(role => isRoleComplete(role));
                console.log('📊 Complete roles to save:', completeRoles.length, completeRoles);
                console.log('📊 Original roles:', originalUserRoles.length, originalUserRoles);
                console.log('📊 All userRoles:', userRoles);
                
                for (const role of completeRoles) {
                    console.log('🔄 Processing role:', role.roleName, 'isFromDatabase:', role.isFromDatabase);
                    console.log('📋 Role details:', {
                        roleName: role.roleName,
                        description: role.description || '(empty)',
                        entity: role.entity || '(empty)',
                        product: role.product || '(empty)',
                        service: role.service || '(empty)',
                        scope: role.scope || '(empty)',
                        isFromDatabase: role.isFromDatabase
                    });
                    try {
                        const normalizedRoleName = role.roleName?.trim().toLowerCase() || '';
                        if (normalizedRoleName) {
                            normalizedCurrentRoleNames.add(normalizedRoleName);
                        }

                        let roleId: string | null = role.roleId || null;
                        
                        if (!roleId && normalizedRoleName && roleIdCacheRef.current.has(normalizedRoleName)) {
                            roleId = roleIdCacheRef.current.get(normalizedRoleName)!;
                            console.log('ℹ️ Loaded role ID from cache for', role.roleName, roleId);
                        }

                        if (!roleId) {
                            roleId = await fetchExistingRoleId(role.roleName);
                            if (roleId) {
                                console.log('✅ Found role ID via lookup for', role.roleName, roleId);
                            } else {
                                console.log('ℹ️ Role does not exist in database, will create new if needed');
                            }
                        }

                        // Determine save path based on roleId and isFromDatabase flag
                        console.log('🔀 Save path decision:', {
                            hasRoleId: !!roleId,
                            isFromDatabase: role.isFromDatabase,
                            path: !roleId && !role.isFromDatabase ? 'CREATE_NEW' : 
                                  roleId && role.isFromDatabase ? 'DATABASE_ROLE' : 
                                  roleId && !role.isFromDatabase ? 'UPDATE_EXISTING' : 'UNKNOWN'
                        });
                        
                        // Create role if it doesn't exist (only for new custom roles)
                        if (!roleId && !role.isFromDatabase) {
                            const newRoleData = {
                                name: role.roleName,
                                roleName: role.roleName,
                                description: role.description || '',
                                entity: role.entity || '',
                                product: role.product || '',
                                service: role.service || '',
                                scope: role.scope || '',
                                accountId: selectedAccountId,
                                accountName: selectedAccountName,
                                enterpriseId: selectedEnterpriseId,
                                enterpriseName: selectedEnterprise
                            };
                            
                            try {
                                console.log('🆕 Creating new role with data and account/enterprise context:', newRoleData);
                                const createdRole = await api.post<any>('/api/user-management/roles', newRoleData);
                                console.log('📦 Created role response:', createdRole);
                                
                                // Handle response structure - might be {id: '...'} or {data: {id: '...'}}
                                if (createdRole && typeof createdRole === 'object') {
                                    if ('data' in createdRole && createdRole.data && typeof createdRole.data === 'object') {
                                        roleId = createdRole.data.id?.toString();
                                    } else if ('id' in createdRole) {
                                        roleId = createdRole.id?.toString();
                                    }
                                }
                                
                                console.log('✅ Created new role with ID:', roleId);
                            } catch (createError) {
                                console.warn('⚠️ Could not create role in database, continuing with local state:', createError);
                                // Use the local role ID if API fails
                                roleId = role.id;
                            }
                        } else if (roleId && role.isFromDatabase) {
                            // Role is from database and already exists
                            // Check if any fields are populated (user filled them in)
                            const hasFilledFields = role.description || role.entity || role.product || role.service || role.scope;
                            
                            console.log('🔍 Database role check:', {
                                roleId,
                                roleName: role.roleName,
                                hasFilledFields,
                                description: role.description || '(empty)',
                                entity: role.entity || '(empty)',
                                product: role.product || '(empty)',
                                service: role.service || '(empty)',
                                scope: role.scope || '(empty)'
                            });
                            
                            if (hasFilledFields) {
                                // User filled in additional fields for a database role
                                // Update the role with these values
                                try {
                                    console.log('🔄 Updating database role with user-filled values:', roleId);
                                    console.log('📦 Update data:', {
                                        description: role.description,
                                        entity: role.entity,
                                        product: role.product,
                                        service: role.service,
                                        scope: role.scope
                                    });
                                    
                                    const updateData = {
                                        description: role.description || '',
                                        entity: role.entity || '',
                                        product: role.product || '',
                                        service: role.service || '',
                                        scope: role.scope || '',
                                        accountId: selectedAccountId,
                                        accountName: selectedAccountName,
                                        enterpriseId: selectedEnterpriseId,
                                        enterpriseName: selectedEnterprise
                                    };
                                    
                                    await api.put(`/api/user-management/roles/${roleId}`, updateData);
                                    console.log('✅ Updated database role with user-filled fields:', roleId);
                                } catch (updateError) {
                                    console.warn('⚠️ Could not update role in database, continuing with existing data:', updateError);
                                }
                            } else {
                                // Role is from database with no additional fields - just use its ID
                                console.log('ℹ️ Role is from database with no changes, using existing ID:', roleId);
                            }
                        } else if (roleId && !role.isFromDatabase) {
                            // This is a custom role that happens to match an existing role name
                            // Update it with the custom values
                            try {
                                console.log('🔄 Updating existing role with custom values:', roleId);
                                const updateData = {
                                    description: role.description || '',
                                    entity: role.entity || '',
                                    product: role.product || '',
                                    service: role.service || '',
                                    scope: role.scope || '',
                                    accountId: selectedAccountId,
                                    accountName: selectedAccountName,
                                    enterpriseId: selectedEnterpriseId,
                                    enterpriseName: selectedEnterprise
                                };
                                
                                await api.put(`/api/user-management/roles/${roleId}`, updateData);
                                console.log('✅ Updated existing role:', roleId);
                            } catch (updateError) {
                                console.warn('⚠️ Could not update role in database, continuing with existing data:', updateError);
                            }
                        }

                        if (roleId) {
                            roleIdByLocalId.set(role.id, roleId);
                            if (normalizedRoleName) {
                                roleIdCacheRef.current.set(normalizedRoleName, roleId);
                            }

                            const wasOriginallyAssigned = normalizedRoleName
                                ? normalizedOriginalRoleNames.has(normalizedRoleName)
                                : false;
                            
                            if (!wasOriginallyAssigned) {
                                if (roleIdsToAssign.includes(roleId)) {
                                    console.warn('⚠️ Duplicate role ID detected:', roleId, 'for role:', role.roleName);
                                } else {
                                    roleIdsToAssign.push(roleId);
                                    console.log('✅ Added role ID to assignment list:', roleId, 'for role:', role.roleName);
                                }
                            } else {
                                console.log('ℹ️ Role already assigned previously, skipping POST enqueue:', role.roleName);
                            }
                        } else {
                            console.error('❌ Could not get role ID for:', role.roleName, '- role will not be assigned');
                        }
                    } catch (error) {
                        console.error(`❌ Error processing role ${role.roleName}:`, error);
                    }
                }
                
                console.log('📊 New roleIds to assign:', roleIdsToAssign);

                const rolesToDelete = Array.from(normalizedOriginalRoleNames).filter(
                    name => !normalizedCurrentRoleNames.has(name)
                );

                if (rolesToDelete.length > 0) {
                    console.log('🗑️ Roles to delete from group:', rolesToDelete);
                    for (const normalizedName of rolesToDelete) {
                        const originalRole = originalUserRoles.find(
                            role => role.roleName?.trim().toLowerCase() === normalizedName
                        );
                        const friendlyName = originalRole?.roleName || normalizedName;
                        let roleIdToDelete: string | undefined = originalRole?.roleId;
                        if (!roleIdToDelete) {
                            const cachedOrFetched =
                                roleIdCacheRef.current.get(normalizedName) ||
                                (await fetchExistingRoleId(friendlyName)) ||
                                undefined;
                            roleIdToDelete = cachedOrFetched;
                        }
                        if (!roleIdToDelete) {
                            console.warn('⚠️ Could not determine role ID to delete for:', friendlyName);
                            continue;
                        }

                        const deleteUrl = `/api/user-management/groups/${actualGroupId}/roles/${roleIdToDelete}${buildContextQueryString()}`;
                        console.log('🗑️ Deleting role assignment via:', deleteUrl);
                        try {
                            await api.del(deleteUrl);
                            roleIdCacheRef.current.delete(normalizedName);
                            console.log('✅ Deleted role assignment for', friendlyName);
                        } catch (deleteError) {
                            console.error('❌ Failed to delete role assignment for', friendlyName, deleteError);
                            alert(`Failed to delete role ${friendlyName}. Please try again.`);
                            throw deleteError;
                        }
                    }
                } else {
                    console.log('ℹ️ No role assignments to delete');
                }

                if (roleIdsToAssign.length > 0) {
                    try {
                        console.log(`🔄 Assigning ${roleIdsToAssign.length} new roles to group ${actualGroupId}`);
                        const apiUrl = `/api/user-management/groups/${actualGroupId}/roles${buildContextQueryString()}`;
                        console.log('🌐 [API Call] POSTing assigned roles to:', apiUrl);
                        
                        const assignPayload = {
                            roleIds: roleIdsToAssign,
                            groupId: actualGroupId
                        };
                        console.log('📦 Assign payload:', assignPayload);
                        
                        const assignResponse = await api.post(apiUrl, assignPayload);
                        console.log('📦 Assign response:', assignResponse);
                        
                        if (assignResponse && typeof assignResponse === 'object') {
                            const responseWithStatus = assignResponse as { success?: boolean; error?: string };
                            if (responseWithStatus.success === false) {
                                const errorMessage = responseWithStatus.error || 'Failed to assign roles';
                                console.error('❌ Backend returned error:', errorMessage);
                                throw new Error(errorMessage);
                            }
                        }
                        
                        console.log('✅ Successfully added new role assignments in database');
                    } catch (assignError: any) {
                        console.error('❌ Failed to assign roles to group in database:', assignError);
                        console.error('❌ Error details:', assignError.message || assignError);
                        alert(`Failed to assign roles: ${assignError.message || 'Please check if the group exists and try again.'}`);
                        throw assignError;
                    }
                } else {
                    console.log('ℹ️ No new roles to assign via POST (only updates/deletes performed)');
                }
            } else if (isTemporaryGroup) {
                // Group has temporary ID - save to frontend state only
                console.log('⚠️ Group has temporary ID, skipping database save. Roles will be saved when group is created.');
            } else {
                console.warn('⚠️ No valid group ID found, cannot save to database');
            }

            // Call parent onSave callback with complete roles only
            // Mark all complete roles as from database since they're now saved
            const completeRolesForParent = userRoles
                .filter(role => isRoleComplete(role))
                .map(role => ({
                    ...role,
                    roleId: roleIdByLocalId.get(role.id) || role.roleId,
                    isFromDatabase: true // Mark as from database after save
                }));
            console.log('📤 Calling onSave with complete roles (all marked as isFromDatabase: true):', completeRolesForParent);
            onSave(completeRolesForParent);
            setHasUnsavedChanges(false);
            setValidationErrors(new Set());
            setShowValidationErrors(false);
            
            // Show success message
            console.log('✅ Successfully saved roles to state and database');
            
            onClose();
        } catch (error) {
            console.error('❌ Error saving roles:', error);
            alert('Failed to save roles. Please try again.');
        } finally {
            setIsSaving(false);
        }
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

    // State for delete confirmation
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
    const [deletingGroup, setDeletingGroup] = useState(false);
    const [compressingRoleId, setCompressingRoleId] = useState<string | null>(null);
    const [foldingRoleId, setFoldingRoleId] = useState<string | null>(null);

    // Start row compression animation - Match ManageUsersTable exactly
    const startRowCompressionAnimation = async (groupId: string) => {
        console.log('🎬 Starting squeeze animation for role:', groupId);

        // Step 1: Squeeze the row horizontally with animation
        setCompressingRoleId(groupId);

        // Wait for squeeze animation
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 2: Fade out the row
        setFoldingRoleId(groupId);
        setCompressingRoleId(null);

        // Wait for fade animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 3: Show confirmation modal
        setPendingDeleteGroupId(groupId);
        setShowDeleteConfirmation(true);
        setFoldingRoleId(null);
    };

    // Handle delete click - start compression animation
    const handleDeleteClick = (groupId: string) => {
        startRowCompressionAnimation(groupId);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!pendingDeleteGroupId) return;

        setDeletingGroup(true);
        try {
            // Add a small delay to show the loading state
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Remove from userRoles
            const updatedGroups = userRoles.filter(group => group.id !== pendingDeleteGroupId);
            setUserRoles(updatedGroups);
            
            // Remove from selectedUserRoles
            setSelectedUserRoles(prev => prev.filter(group => group.id !== pendingDeleteGroupId));
            
            // Remove from auto-filled groups tracking
            autoFilledGroupsRef.current.delete(pendingDeleteGroupId);
            console.log('🧹 Removed deleted group from auto-filled tracking:', pendingDeleteGroupId);
            
            // Close modal and reset state
            setShowDeleteConfirmation(false);
            setPendingDeleteGroupId(null);
            setCompressingRoleId(null);
            setFoldingRoleId(null);
        } catch (error) {
            console.error('❌ Failed to delete role:', error);
        } finally {
            setDeletingGroup(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirmation(false);
        setPendingDeleteGroupId(null);
        setCompressingRoleId(null);
        setFoldingRoleId(null);
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleGlobalClick = (event: MouseEvent) => {
            if (!modalRef.current) return;
            const target = event.target as Node;

            if (modalRef.current.contains(target)) {
                return;
            }

            if (showScopeModal) {
                return;
            }

            if (
                target instanceof HTMLElement &&
                target.closest('[data-role-portal="true"]')
            ) {
                return;
            }

            handleClose();
        };

        document.addEventListener('mousedown', handleGlobalClick);
        return () => {
            document.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [isOpen, showScopeModal, handleClose]);

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
                <div
                    className={`w-10 bg-slate-800 text-white flex flex-col relative h-screen ${
                        showScopeModal ? 'cursor-pointer hover:brightness-110' : ''
                    }`}
                    onClick={showScopeModal ? handleCloseScopeModal : undefined}
                    title={showScopeModal ? 'Click to return to Assigned Roles' : undefined}
                >
                    <img 
                        src="/images/logos/sidebar.png" 
                        alt="Sidebar" 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Middle Text - Rotated and Bold */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
                        <div className="flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide">
                            <Shield className="h-4 w-4" />
                            <span>Assign Roles</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white overflow-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-base">Configure Assigned Roles</p>
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
                        
                        {/* Group Info */}
                        <div className="mt-4 flex gap-3">
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">Group Name</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{groupName || '\u00A0'}</div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="text-blue-100 text-sm font-medium mb-1">Description</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{groupDescription || '\u00A0'}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Selected Roles Count */}
                        <div className="mt-3">
                            <div className="text-blue-100 text-sm">
                                Assigned Roles: <span className="font-semibold text-white">{userRoles.filter(role => isRoleComplete(role)).length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar - Match ManageUsersTable exactly */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left side - Create New Role Button and Global Search */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addNewUserRole();
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Create New Role</span>
                                </button>
                                
                                {/* Global Search - Match ManageUsersTable exactly */}
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

                    {/* Loading, Empty State, or Table */}
                    {isLoadingData ? (
                        // Loading State
                        <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                            <div className='mx-auto max-w-md'>
                                <div className='mx-auto h-12 w-12 text-primary-600 animate-spin'>
                                    <svg
                                        className='h-full w-full'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                    >
                                        <circle
                                            className='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='4'
                                        />
                                        <path
                                            className='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                    Loading Assigned Roles
                                </h3>
                                <p className='mt-2 text-sm text-slate-500'>
                                    Please wait while we fetch your data...
                                </p>
                            </div>
                        </div>
                    ) : userRoles.length === 0 ? (
                        // Empty State
                        <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                            <div className='mx-auto max-w-md'>
                                <svg
                                    className='mx-auto h-12 w-12 text-slate-400'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    aria-hidden='true'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6m-6 4h6'
                                    />
                                </svg>
                                <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                    No Roles Assigned
                                </h3>
                                <p className='mt-2 text-sm text-slate-500'>
                                    No roles have been assigned yet. Assign a new role to get started.
                                </p>
                                <div className='mt-6'>
                                    <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addNewUserRole();
                                    }}
                                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Create New Role</span>
                                </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* AssignedUserRoleTable Component - Only show when groups exist and not loading */
                        <AssignedUserRoleTable
                            userRoles={userRoles}
                            onUpdateUserRoles={handleUpdateUserRoles}
                            searchQuery={appliedSearchTerm}
                            onDeleteClick={handleDeleteClick}
                            compressingRoleId={compressingRoleId}
                            foldingRoleId={foldingRoleId}
                            selectedEnterprise={selectedEnterprise}
                            selectedEnterpriseId={selectedEnterpriseId}
                            selectedAccountId={selectedAccountId}
                            selectedAccountName={selectedAccountName}
                            validationErrors={validationErrors}
                            showValidationErrors={showValidationErrors}
                            onAddNewRow={addNewUserRole}
                            availableRoles={availableGroups}
                            onOpenScopeModal={handleOpenScopeModal}
                        />
                    )}
                </div>
            </motion.div>

            <ScopeConfigModal
                isOpen={showScopeModal}
                onClose={handleCloseScopeModal}
                roleName={selectedRoleForScope?.roleName || ''}
                roleDescription={selectedRoleForScope?.description || ''}
                currentScope={parseScopeValue(selectedRoleForScope?.scope)}
                onSave={handleScopeSave}
                stackLevel={normalizedStackLevel + 1}
            />

            {/* Unsaved Changes Confirmation Dialog */}
            <AnimatePresence>
                {showUnsavedChangesDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-auto"
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

            {/* Delete Confirmation Modal - Match ManageUsersTable exactly */}
            {showDeleteConfirmation && (
                <div className='fixed inset-0 z-[10001] overflow-y-auto pointer-events-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={handleDeleteCancel}
                        ></div>

                        <motion.div
                            className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'
                            initial={{opacity: 0, scale: 0.9}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.9}}
                            transition={{duration: 0.2}}
                        >
                            <div className='sm:flex sm:items-start'>
                                <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                                    <svg
                                        className='h-6 w-6 text-red-600'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        strokeWidth='1.5'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                        />
                                    </svg>
                                </div>
                                <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-900'>
                                            Are you sure you want to delete this role assignment?
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    disabled={deletingGroup}
                                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto'
                                    onClick={handleDeleteConfirm}
                                >
                                    {deletingGroup ? (
                                        <>
                                            <svg
                                                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                                                fill='none'
                                                viewBox='0 0 24 24'
                                            >
                                                <circle
                                                    className='opacity-25'
                                                    cx='12'
                                                    cy='12'
                                                    r='10'
                                                    stroke='currentColor'
                                                    strokeWidth='4'
                                                ></circle>
                                                <path
                                                    className='opacity-75'
                                                    fill='currentColor'
                                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                                ></path>
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Yes'
                                    )}
                                </button>
                                <button
                                    type='button'
                                    disabled={deletingGroup}
                                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto'
                                    onClick={handleDeleteCancel}
                                >
                                    No
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignedUserRoleModal;