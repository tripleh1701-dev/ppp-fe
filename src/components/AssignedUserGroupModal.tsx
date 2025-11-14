import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Plus, Users, Save, XCircle } from 'lucide-react';
import { BookmarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { generateId } from '@/utils/id-generator';
import { api } from '@/utils/api';
import AssignedUserGroupTable from './AssignedUserGroupTable';
import AssignedUserRoleModal, { UserRole } from './AssignedUserRoleModal';

const normalizeAssignedRolesInput = (assignedRoles: any, rolesString?: string) => {
    if (Array.isArray(assignedRoles) && assignedRoles.length > 0) {
        return assignedRoles;
    }
    if (typeof assignedRoles === 'string') {
        rolesString = assignedRoles;
    }
    if (rolesString) {
        return rolesString
            .split(',')
            .map((name) => ({ roleName: name.trim() }))
            .filter((role) => role.roleName);
    }
    return [];
};

const transformAssignedRoles = (rolesData: any): UserRole[] => {
    if (!Array.isArray(rolesData)) return [];
    return rolesData
        .map((role: any) => {
            const normalized = typeof role === 'string' ? { roleName: role } : role || {};
            const roleName = normalized.name || normalized.roleName || '';
            if (!roleName.trim()) {
                return null;
            }
            return {
                id: normalized.id?.toString() || normalized.roleAssignmentId?.toString() || generateId(),
                roleId: normalized.roleId?.toString() || normalized.id?.toString(),
                roleName: roleName.trim(),
                description: normalized.description || '',
                entity: normalized.entity || '',
                product: normalized.product || '',
                service: normalized.service || '',
                scope: normalized.scope || '',
                isFromDatabase: normalized.isFromDatabase ?? true
            };
        })
        .filter(Boolean) as UserRole[];
};

const normalizeUserGroupData = (group: UserGroup | any): UserGroup => {
    const assignedRolesInput = normalizeAssignedRolesInput(group.assignedRoles, group.roles);
    const assignedRoles = transformAssignedRoles(assignedRolesInput);
    const rolesDisplay = assignedRoles.length > 0
        ? assignedRoles.map((role) => role.roleName).filter(Boolean).join(', ')
        : (group.roles || '');

    return {
        ...group,
        roles: rolesDisplay,
        assignedRoles,
        groupId: group.groupId,
    };
};

export interface UserGroup {
    id: string;
    groupId?: string;
    groupName: string;
    description: string;
    entity: string;
    product: string;
    service: string;
    roles: string;
    assignedRoles?: UserRole[];
    isFromDatabase?: boolean; // Flag to indicate if this is an existing group from database (fields should be read-only)
}

interface AssignedUserGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userGroups: UserGroup[]) => void;
    onRolesUpdated?: (updatedGroups: UserGroup[]) => void;
    firstName: string;
    lastName: string;
    emailAddress: string;
    userId?: string;
    initialUserGroups?: UserGroup[];
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    stackLevel?: number;
}

const AssignedUserGroupModal: React.FC<AssignedUserGroupModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onRolesUpdated,
    firstName,
    lastName,
    emailAddress,
    userId,
    initialUserGroups = [],
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
    stackLevel = 0
}) => {
    // State management
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    const [selectedUserGroups, setSelectedUserGroups] = useState<UserGroup[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // Applied search term
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [originalUserGroups, setOriginalUserGroups] = useState<UserGroup[]>([]);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // For save operation
    const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]); // All available groups from database with full details
    const [isLoadingData, setIsLoadingData] = useState(false); // For initial data load
    const [showRolesModal, setShowRolesModal] = useState(false);
    const [selectedGroupForRoles, setSelectedGroupForRoles] = useState<UserGroup | null>(null);
    
    // Track if data has been loaded for this modal session
    const dataLoadedRef = useRef(false);
    
    // Track if we've ever fetched from API for this user (across all modal opens)
    const hasEverFetchedFromAPIRef = useRef(false);
    
    // Track the current userId to detect when it changes (different user)
    const lastUserIdRef = useRef<string | undefined>(userId);
    
    // Reset hasEverFetchedFromAPIRef when userId changes (opening modal for different user)
    useEffect(() => {
        if (userId !== lastUserIdRef.current) {
            console.log('🔄 userId changed from', lastUserIdRef.current, 'to', userId, '- resetting hasEverFetchedFromAPIRef');
            hasEverFetchedFromAPIRef.current = false;
            lastUserIdRef.current = userId;
        }
    }, [userId]);

    // Load user groups from database when modal opens
    const loadUserGroups = useCallback(async () => {
        if (!isOpen) return;
        
        console.log('🔄 loadUserGroups called, loading data...');
        console.log('🔍 dataLoadedRef.current:', dataLoadedRef.current);
        console.log('🔍 initialUserGroups:', initialUserGroups);
        
        // Set loading state
        setIsLoadingData(true);
        
        try {
            // Check if user ID is temporary (user not yet saved to database)
            const isTemporaryUser = userId?.startsWith('tmp-');
            console.log('📂 Loading user groups, userId:', userId, 'isTemporary:', isTemporaryUser);
            
            if (isTemporaryUser) {
                // For temporary users, use initialUserGroups from parent state
                console.log('📦 Using initialUserGroups for temporary user:', initialUserGroups);
                const normalizedInitial = initialUserGroups.map(normalizeUserGroupData);
                setUserGroups(normalizedInitial);
                setSelectedUserGroups(normalizedInitial);
                setOriginalUserGroups(JSON.parse(JSON.stringify(normalizedInitial)));
                return;
            }
            
            // Try to fetch user groups from API for saved users
            let actualUserId = userId;
            if (!actualUserId && emailAddress) {
                try {
                    const users = await api.get<any[]>(`/api/users?email=${encodeURIComponent(emailAddress)}`);
                    if (users && users.length > 0) {
                        actualUserId = users[0].id?.toString();
                    }
                } catch (error) {
                    console.warn('Could not fetch user by email:', error);
                }
            }
            
            if (actualUserId && !actualUserId.startsWith('tmp-')) {
                // Data loading strategy:
                // 1. On FIRST OPEN (never fetched before): Fetch from API to get initial database state
                // 2. On SUBSEQUENT OPENS: Use parent state as source of truth (may be empty if user deleted all)
                console.log('📦 initialUserGroups from parent (length:', initialUserGroups.length, '):', initialUserGroups);
                console.log('📦 hasEverFetchedFromAPIRef:', hasEverFetchedFromAPIRef.current);
                
                let finalGroups = initialUserGroups;
                
                // Only fetch from API if:
                // 1. Parent state is empty (or not yet populated)
                // 2. AND we've never fetched from API before (first time opening modal)
                const shouldFetchFromAPI = initialUserGroups.length === 0 && !hasEverFetchedFromAPIRef.current;
                
                if (shouldFetchFromAPI) { // Fetch from API on first open only
                    console.log('⚠️ initialUserGroups is empty, trying to fetch from API...');
                    try {
                        // Build query parameters for fetching user groups
                        const queryParams = new URLSearchParams();
                        if (selectedAccountId) queryParams.append('accountId', selectedAccountId);
                        if (selectedAccountName) queryParams.append('accountName', selectedAccountName);
                        if (selectedEnterpriseId) queryParams.append('enterpriseId', selectedEnterpriseId);
                        if (selectedEnterprise) queryParams.append('enterpriseName', selectedEnterprise);
                        
                        const apiUrl = `/api/user-management/users/${actualUserId}/groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
                        console.log('🌐 [API Call] Fetching user groups from:', apiUrl);
                        
                        // Fetch assigned user groups for this user
                        const response = await api.get<any>(apiUrl);
                        console.log('📦 Loaded user groups from database:', response);
                        console.log('📦 Response type:', typeof response, 'Is array:', Array.isArray(response));
                        
                        // Handle response structure - could be direct array or {success: true, data: [...]} or {success: true, data: {groups: [...]}}
                        let groupsData = response;
                        if (response && typeof response === 'object' && 'data' in response) {
                            console.log('📦 Response has data property, extracting...', response.data);
                            groupsData = response.data;
                            
                            // Check if data has a nested groups property
                            if (groupsData && typeof groupsData === 'object' && 'groups' in groupsData) {
                                console.log('📦 Data has groups property, extracting...', groupsData.groups);
                                groupsData = groupsData.groups;
                            }
                        }
                        
                        console.log('📦 Final groupsData:', groupsData, 'Is array:', Array.isArray(groupsData));
                        
                        if (groupsData && Array.isArray(groupsData) && groupsData.length > 0) {
                            // Convert API response to UserGroup format
                            // IMPORTANT: Always generate a new unique ID for each user-group assignment
                            // to avoid duplicate key issues (user can have same group assigned multiple times)
                            const loadedGroups: UserGroup[] = groupsData.map((group: any) => {
                                const parsedAssignedRoles = transformAssignedRoles(group.assignedRoles);
                                const rolesDisplay = parsedAssignedRoles.length > 0
                                    ? parsedAssignedRoles
                                        .map((role) => role.roleName)
                                        .filter(Boolean)
                                        .join(', ')
                                    : (Array.isArray(group.assignedRoles)
                                        ? group.assignedRoles.join(', ')
                                        : (group.roles || ''));

                                return {
                                    id: generateId(), // Always generate unique ID for this assignment
                                    groupId: group.id?.toString() || group.groupId?.toString(),
                                    groupName: group.name || group.groupName || '',
                                    description: group.description || '',
                                    entity: group.entity || '',
                                    product: group.product || '',
                                    service: group.service || '',
                                    roles: rolesDisplay,
                                    assignedRoles: parsedAssignedRoles,
                                    isFromDatabase: true // Mark as from database since it's an existing assignment
                                };
                            });
                            
                            console.log('✅ Loaded and parsed user groups from API:', loadedGroups);
                            console.log('✅ Unique IDs generated:', loadedGroups.map(g => g.id));
                            finalGroups = loadedGroups;
                            
                            // Mark that we've fetched from API (don't fetch again on subsequent opens)
                            hasEverFetchedFromAPIRef.current = true;
                            console.log('✅ Set hasEverFetchedFromAPIRef to true');
                        } else {
                            console.log('⚠️ API returned no valid data, using initialUserGroups');
                            // Still mark as fetched to avoid trying again
                            hasEverFetchedFromAPIRef.current = true;
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not load user groups from database, using initialUserGroups:', error);
                        // Mark as fetched even on error to avoid retry loops
                        hasEverFetchedFromAPIRef.current = true;
                    }
                } else {
                    console.log('✅ Using initialUserGroups from parent as source of truth (length:', initialUserGroups.length, ')');
                    // Already fetched before OR parent has data, so mark as fetched
                    if (!hasEverFetchedFromAPIRef.current) {
                        hasEverFetchedFromAPIRef.current = true;
                        console.log('✅ Set hasEverFetchedFromAPIRef to true (using parent state)');
                    }
                }
                
                // Set the final groups
                const normalizedFinalGroups = finalGroups.map(normalizeUserGroupData);
                console.log('💾 Setting userGroups to normalized finalGroups (length:', normalizedFinalGroups.length, '):', normalizedFinalGroups);
                setUserGroups(normalizedFinalGroups);
                setSelectedUserGroups(normalizedFinalGroups);
                setOriginalUserGroups(JSON.parse(JSON.stringify(normalizedFinalGroups)));
            } else {
                // No userId or temporary user, use initialUserGroups
                console.log('📦 No valid user ID, using initialUserGroups');
                const normalizedInitial = initialUserGroups.map(normalizeUserGroupData);
                setUserGroups(normalizedInitial);
                setSelectedUserGroups(normalizedInitial);
                setOriginalUserGroups(JSON.parse(JSON.stringify(normalizedInitial)));
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
            const normalizedInitial = initialUserGroups.map(normalizeUserGroupData);
            setUserGroups(normalizedInitial);
            setSelectedUserGroups(normalizedInitial);
            setOriginalUserGroups(JSON.parse(JSON.stringify(normalizedInitial)));
        } finally {
            // Clear loading state
            setIsLoadingData(false);
        }
        
        console.log('✅ loadUserGroups complete, data loaded successfully');
    }, [isOpen, userId, emailAddress, initialUserGroups, selectedAccountId, selectedAccountName, selectedEnterpriseId, selectedEnterprise]);

    // Load all available groups from database filtered by account and enterprise
    const loadAllAvailableGroups = useCallback(async () => {
        console.log('🔄 Loading available groups from database with filters...');
        console.log('🔍 Account/Enterprise context:', {
            selectedAccountId,
            selectedAccountName,
            selectedEnterprise,
            selectedEnterpriseId
        });
        
        try {
            // Build query parameters with account and enterprise filters - exactly like Manage User Groups
            const queryParams = new URLSearchParams();
            if (selectedAccountId) queryParams.append('accountId', selectedAccountId);
            if (selectedAccountName) queryParams.append('accountName', selectedAccountName);
            if (selectedEnterpriseId) queryParams.append('enterpriseId', selectedEnterpriseId);
            if (selectedEnterprise) queryParams.append('enterpriseName', selectedEnterprise);
            
            const apiUrl = `/api/user-management/groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            console.log('🌐 [API Call] Making request to:', apiUrl);
            
            const response = await api.get<any>(apiUrl);
            console.log('📦 Filtered groups response:', response);
            
            // Handle response structure
            let groupsData = response;
            if (response && typeof response === 'object' && 'data' in response) {
                groupsData = response.data;
                if (groupsData && typeof groupsData === 'object' && 'groups' in groupsData) {
                    groupsData = groupsData.groups;
                }
            }
            
            if (groupsData && Array.isArray(groupsData)) {
                const formattedGroups: UserGroup[] = groupsData.map((group: any) => {
                    const parsedAssignedRoles = transformAssignedRoles(group.assignedRoles);
                    const rolesDisplay = parsedAssignedRoles.length > 0
                        ? parsedAssignedRoles.map((role) => role.roleName).filter(Boolean).join(', ')
                        : (Array.isArray(group.assignedRoles)
                            ? group.assignedRoles.join(', ')
                            : (group.roles || ''));

                    const formatted: UserGroup = {
                        id: group.id?.toString() || generateId(),
                        groupId: group.id?.toString() || group.groupId?.toString(),
                        groupName: group.name || group.groupName || '',
                        description: group.description || '',
                        entity: group.entity || '',
                        product: group.product || '',
                        service: group.service || '',
                        roles: rolesDisplay,
                        assignedRoles: parsedAssignedRoles,
                        isFromDatabase: true // Mark as from database
                    };
                    console.log('📋 Formatted group:', formatted);
                    return formatted;
                });
                
                setAvailableGroups(formattedGroups);
                console.log('✅ Loaded and cached', formattedGroups.length, 'available groups');
                return formattedGroups;
            } else {
                console.log('⚠️ No groups data found');
                setAvailableGroups([]);
                return [];
            }
        } catch (error) {
            console.warn('⚠️ Could not load available groups:', error);
            setAvailableGroups([]);
            return [];
        }
    }, [selectedAccountId, selectedAccountName, selectedEnterprise, selectedEnterpriseId]);

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
                
                // Reset UI state
                setSearchTerm('');
                setAppliedSearchTerm('');
                setHasUnsavedChanges(false);
                setValidationErrors(new Set());
                setShowValidationErrors(false);
                
                // Set flag to prevent double-loading in React Strict Mode
                if (!dataLoadedRef.current) {
                    dataLoadedRef.current = true;
                    console.log('📞 Calling loadUserGroups and loadAllAvailableGroups');
                    loadUserGroups();
                    loadAllAvailableGroups();
                }
            } else {
                console.log('⏭️ Modal re-rendered while open, skipping data load');
            }
        } else {
            // Reset the flag and loading state when modal closes
            console.log('🚪 Modal closing, resetting data loaded flag and loading state');
            dataLoadedRef.current = false;
            setIsLoadingData(false);
            // Clear auto-filled groups tracking for next modal session
            autoFilledGroupsRef.current.clear();
            console.log('🧹 Cleared auto-filled groups tracking');
        }
        
        // Update the previous open state
        prevIsOpenRef.current = isOpen;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // Only depend on isOpen, not loadUserGroups, to prevent re-triggering on re-renders

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen && originalUserGroups.length >= 0) {
            const hasChanges = JSON.stringify(selectedUserGroups.map(g => g.id).sort()) !== 
                             JSON.stringify(originalUserGroups.map(g => g.id).sort());
            setHasUnsavedChanges(hasChanges);
        }
    }, [selectedUserGroups, originalUserGroups, isOpen]);

    // Check if a group has all mandatory fields filled
    const isGroupComplete = (group: UserGroup): boolean => {
        const complete = !!(
            group.groupName?.trim() &&
            group.entity?.trim() &&
            group.product?.trim() &&
            group.service?.trim()
        );
        console.log('🔍 isGroupComplete check:', {
            groupId: group.id,
            groupName: group.groupName || '(empty)',
            entity: group.entity || '(empty)',
            product: group.product || '(empty)',
            service: group.service || '(empty)',
            complete
        });
        return complete;
    };

    // Check if the last group is complete (to allow adding new row) - memoized for reactivity
    const canAddNewRow = useMemo((): boolean => {
        if (userGroups.length === 0) return true;
        const lastGroup = userGroups[userGroups.length - 1];
        return isGroupComplete(lastGroup);
    }, [userGroups]);

    // Store reference to track which groups have been auto-filled to prevent re-processing
    const autoFilledGroupsRef = useRef<Set<string>>(new Set());
    
    // Handle user group updates with auto-population for existing groups
    const handleUpdateUserGroups = useCallback((updatedGroups: UserGroup[]) => {
        console.log('🔄 handleUpdateUserGroups called with:', updatedGroups);
        console.log('📋 Available groups in cache:', availableGroups.length);
        console.log('📋 Auto-filled groups ref:', Array.from(autoFilledGroupsRef.current));
        
        // Process each group to see if it matches a cached group
        const groupsWithAutoFill = updatedGroups.map((group) => {
            console.log('🔍 Processing group in handleUpdateUserGroups:', {
                id: group.id,
                groupName: group.groupName,
                isFromDatabase: group.isFromDatabase,
                entity: group.entity,
                product: group.product
            });
            
            // If groupName is empty, clear all auto-populated fields and mark as not auto-filled
            if (!group.groupName.trim()) {
                console.log('🧹 Group name is empty, clearing all fields for group:', group.id);
                autoFilledGroupsRef.current.delete(group.id); // Remove from auto-filled set
                return {
                    ...group,
                    groupName: '',
                    description: '',
                    entity: '',
                    product: '',
                    service: '',
                    roles: '',
                    groupId: undefined,
                    assignedRoles: [],
                    isFromDatabase: false // Mark as not from database (editable)
                };
            }
            
            // Skip if already marked as from database (don't re-process)
            if (group.isFromDatabase) {
                console.log('⏭️ Skipping auto-fill for database group:', group.groupName, 'Returning as-is');
                return group;
            }
            
            // Check if this group has already been auto-filled
            // If yes, don't overwrite user's manual changes
            if (autoFilledGroupsRef.current.has(group.id)) {
                console.log('⏭️ Group already auto-filled, preserving user changes:', group.groupName);
                return group; // Return as-is to preserve user's manual edits
            }
            
            // Check cache (availableGroups) for matching group
            const cachedGroup = availableGroups.find(
                ag => ag.groupName.toLowerCase() === group.groupName.trim().toLowerCase()
            );
            
            if (cachedGroup) {
                console.log('✅ Auto-populating from cache for existing group:', cachedGroup.groupName);
                console.log('📋 Cached group details:', {
                    description: cachedGroup.description,
                    entity: cachedGroup.entity,
                    product: cachedGroup.product,
                    service: cachedGroup.service,
                    roles: cachedGroup.roles
                });
                
                // Check if the cached group has all mandatory fields filled
                const isCachedGroupComplete = !!(
                    cachedGroup.entity?.trim() &&
                    cachedGroup.product?.trim() &&
                    cachedGroup.service?.trim()
                );
                
                console.log('🔍 Is cached group complete?', isCachedGroupComplete, {
                    entity: cachedGroup.entity || '(empty)',
                    product: cachedGroup.product || '(empty)',
                    service: cachedGroup.service || '(empty)'
                });
                
                // Mark this group as auto-filled to prevent overwriting user changes
                autoFilledGroupsRef.current.add(group.id);
                console.log('✅ Marked group as auto-filled:', group.id);
                
                // Auto-populate all fields from the cached group
                return {
                    ...group,
                    groupName: cachedGroup.groupName,
                    description: cachedGroup.description,
                    entity: cachedGroup.entity,
                    product: cachedGroup.product,
                    service: cachedGroup.service,
                    roles: cachedGroup.roles,
                    groupId: cachedGroup.groupId || group.groupId,
                    assignedRoles: cachedGroup.assignedRoles || [],
                    // Mark as from database ONLY if all mandatory fields are complete
                    // If incomplete, keep editable so user can fill in the missing fields
                    isFromDatabase: isCachedGroupComplete
                };
            }
            
            // Not in cache, treat as new custom group
            console.log('ℹ️ Group not found in cache, treating as new custom group:', group.groupName);
            return group;
        });
        
        setUserGroups(groupsWithAutoFill);
    }, [availableGroups]);

    const handleOpenRolesModal = useCallback((group: UserGroup) => {
        if (!group.groupId) {
            alert('Please save this user group before managing roles.');
            return;
        }
        setSelectedGroupForRoles(group);
        setShowRolesModal(true);
    }, []);

    const handleCloseRolesModal = useCallback(() => {
        setShowRolesModal(false);
        setSelectedGroupForRoles(null);
    }, []);

    const handleSaveRolesFromModal = useCallback((updatedRoles: UserRole[]) => {
        if (!selectedGroupForRoles) return;

        const rolesDisplay = updatedRoles
            .map((role) => role.roleName)
            .filter(Boolean)
            .join(', ');

        let updatedGroupsState: UserGroup[] = [];
        setUserGroups((prev) => {
            updatedGroupsState = prev.map((group) =>
                group.id === selectedGroupForRoles.id
                    ? {
                        ...group,
                        roles: rolesDisplay,
                        assignedRoles: updatedRoles,
                        isFromDatabase: true
                    }
                    : group
            );
            return updatedGroupsState;
        });

        setSelectedUserGroups(updatedGroupsState);
        onRolesUpdated?.(updatedGroupsState);

        setShowRolesModal(false);
        setSelectedGroupForRoles(null);
    }, [selectedGroupForRoles, onRolesUpdated]);

    // Add new user group - called from toolbar button or Add New Row button
    const addNewUserGroup = () => {
        console.log('➕ Add new user group called');
        console.log('📊 Current userGroups:', userGroups);
        console.log('🔍 canAddNewRow value:', canAddNewRow);
        console.log('🔍 userGroups.length:', userGroups.length);
        
        if (userGroups.length > 0) {
            const lastGroup = userGroups[userGroups.length - 1];
            console.log('📋 Last group:', lastGroup);
            console.log('✓ isGroupComplete(lastGroup):', isGroupComplete(lastGroup));
        }
        
        // Validate that previous row is complete
        if (canAddNewRow === false) {
            console.log('❌ Cannot add new row - previous row incomplete');
            // Highlight validation errors for incomplete row
            setShowValidationErrors(true);
            const incompleteGroupId = userGroups[userGroups.length - 1]?.id;
            if (incompleteGroupId) {
                setValidationErrors(new Set([incompleteGroupId]));
            }
            return;
        }
        
        console.log('✅ Adding new user group row');
        const newGroup: UserGroup = {
            id: generateId(),
            groupId: undefined,
            groupName: '',
            description: '',
            entity: '',
            product: '',
            service: '',
            roles: '',
            assignedRoles: []
        };
        console.log('🆕 New group created:', newGroup);
        setUserGroups(prev => {
            const updated = [...prev, newGroup];
            console.log('📝 Updated userGroups:', updated);
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
        
        userGroups.forEach(group => {
            // Check if group has any data entered
            const hasAnyData = !!(
                group.groupName?.trim() ||
                group.entity?.trim() ||
                group.product?.trim() ||
                group.service?.trim() ||
                group.description?.trim() ||
                group.roles?.trim()
            );
            
            // Check if group is complete
            const groupComplete = isGroupComplete(group);
            
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
        if (!hasAtLeastOneCompleteGroup && userGroups.length > 0) {
            // Mark all rows as needing validation
            const allGroupIds = userGroups.map(g => g.id);
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
        console.log('📊 Current userGroups:', userGroups);
        
        // Validate all groups first
        if (!validateAllGroups()) {
            console.log('❌ Validation failed - mandatory fields highlighted in red');
            return;
        }

        console.log('✅ Validation passed, proceeding to save');
        setIsSaving(true);
        try {
            // Get actual userId
            let actualUserId = userId;
            if (!actualUserId) {
                try {
                    const users = await api.get<any[]>(`/api/users?email=${encodeURIComponent(emailAddress)}`);
                    if (users && users.length > 0) {
                        actualUserId = users[0].id?.toString();
                    }
                } catch (error) {
                    console.warn('Could not fetch user by email:', error);
                }
            }

            // Check if user ID is temporary (user not yet saved to database)
            const isTemporaryUser = actualUserId?.startsWith('tmp-');
            console.log('🔍 User ID check:', { actualUserId, isTemporaryUser });

            const groupIdByLocalId = new Map<string, string>();

            if (actualUserId && !isTemporaryUser) {
                // Save user groups to database
                // First, get or create user groups, then assign them to user
                const groupIds: string[] = [];
                
                // Filter out incomplete groups - only process complete groups
                const completeGroups = userGroups.filter(group => isGroupComplete(group));
                console.log('📊 Complete groups to save:', completeGroups.length, completeGroups);
                console.log('📊 Original groups:', originalUserGroups.length, originalUserGroups);
                console.log('📊 All userGroups:', userGroups);
                
                for (const group of completeGroups) {
                    console.log('🔄 Processing group:', group.groupName, 'isFromDatabase:', group.isFromDatabase);
                    console.log('📋 Group details:', {
                        groupName: group.groupName,
                        description: group.description || '(empty)',
                        entity: group.entity || '(empty)',
                        product: group.product || '(empty)',
                        service: group.service || '(empty)',
                        isFromDatabase: group.isFromDatabase
                    });
                    try {
                        // For groups marked as from database, we just need to get their ID
                        // Don't create or update them as they already exist
                        let groupId: string | null = group.groupId ? group.groupId.toString() : null;
                        
                        // Check if group exists by name (with account/enterprise context)
                        try {
                            console.log('🔍 Checking if group exists:', group.groupName);
                            
                            // Build query with account/enterprise filters to find the right group
                            const queryParams = new URLSearchParams();
                            queryParams.append('name', group.groupName);
                            if (selectedAccountId) queryParams.append('accountId', selectedAccountId);
                            if (selectedAccountName) queryParams.append('accountName', selectedAccountName);
                            if (selectedEnterpriseId) queryParams.append('enterpriseId', selectedEnterpriseId);
                            if (selectedEnterprise) queryParams.append('enterpriseName', selectedEnterprise);
                            
                            const existingGroups = await api.get<any[]>(`/api/user-management/groups?${queryParams.toString()}`);
                            console.log('📦 Existing groups response:', existingGroups);
                            
                            // Handle response structure
                            let groupsArray: any = existingGroups;
                            if (existingGroups && typeof existingGroups === 'object' && 'data' in existingGroups) {
                                groupsArray = (existingGroups as any).data;
                            }
                            
                            // Find exact match by name (case-insensitive)
                            if (groupsArray && Array.isArray(groupsArray) && groupsArray.length > 0) {
                                const exactMatch = groupsArray.find((g: any) => 
                                    (g.name || g.groupName || '').toLowerCase() === group.groupName.toLowerCase()
                                );
                                
                                if (exactMatch) {
                                    groupId = exactMatch.id?.toString();
                                    console.log('✅ Found exact match for', group.groupName, 'with ID:', groupId);
                                } else {
                                    console.log('⚠️ API returned groups but no exact match for:', group.groupName);
                                    console.log('⚠️ Returned groups:', groupsArray.map((g: any) => g.name || g.groupName));
                                }
                            } else {
                                console.log('ℹ️ Group does not exist in database, will create new');
                            }
                        } catch (error) {
                            console.log('ℹ️ Error checking for existing group (will create new):', error);
                            // Group doesn't exist, will create
                        }

                        // Determine save path based on groupId and isFromDatabase flag
                        console.log('🔀 Save path decision:', {
                            hasGroupId: !!groupId,
                            isFromDatabase: group.isFromDatabase,
                            path: !groupId && !group.isFromDatabase ? 'CREATE_NEW' : 
                                  groupId && group.isFromDatabase ? 'DATABASE_GROUP' : 
                                  groupId && !group.isFromDatabase ? 'UPDATE_EXISTING' : 'UNKNOWN'
                        });
                        
                        // Create group if it doesn't exist (only for new custom groups)
                        if (!groupId && !group.isFromDatabase) {
                            const newGroupData = {
                                name: group.groupName,
                                groupName: group.groupName,
                                description: group.description || '',
                                entity: group.entity || '',
                                product: group.product || '',
                                service: group.service || '',
                                assignedRoles: group.roles ? group.roles.split(',').map(r => r.trim()).filter(Boolean) : [],
                                accountId: selectedAccountId,
                                accountName: selectedAccountName,
                                enterpriseId: selectedEnterpriseId,
                                enterpriseName: selectedEnterprise
                            };
                            
                            try {
                                console.log('🆕 Creating new group with data and account/enterprise context:', newGroupData);
                                const createdGroup = await api.post<any>('/api/user-management/groups', newGroupData);
                                console.log('📦 Created group response:', createdGroup);
                                
                                // Handle response structure - might be {id: '...'} or {data: {id: '...'}}
                                if (createdGroup && typeof createdGroup === 'object') {
                                    if ('data' in createdGroup && createdGroup.data && typeof createdGroup.data === 'object') {
                                        groupId = createdGroup.data.id?.toString();
                                    } else if ('id' in createdGroup) {
                                        groupId = createdGroup.id?.toString();
                                    }
                                }
                                
                                console.log('✅ Created new group with ID:', groupId);
                            } catch (createError) {
                                console.warn('⚠️ Could not create group in database, continuing with local state:', createError);
                                // Use the local group ID if API fails
                                groupId = group.id;
                            }
                        } else if (groupId && group.isFromDatabase) {
                            // Group is from database and already exists
                            // Check if any fields are populated (user filled them in)
                            const hasFilledFields = group.description || group.entity || group.product || group.service || group.roles;
                            
                            console.log('🔍 Database group check:', {
                                groupId,
                                groupName: group.groupName,
                                hasFilledFields,
                                description: group.description || '(empty)',
                                entity: group.entity || '(empty)',
                                product: group.product || '(empty)',
                                service: group.service || '(empty)'
                            });
                            
                            if (hasFilledFields) {
                                // User filled in additional fields for a database group
                                // Update the group with these values
                                try {
                                    console.log('🔄 Updating database group with user-filled values:', groupId);
                                    console.log('📦 Update data:', {
                                        description: group.description,
                                        entity: group.entity,
                                        product: group.product,
                                        service: group.service
                                    });
                                    
                                    const updateData = {
                                        description: group.description || '',
                                        entity: group.entity || '',
                                        product: group.product || '',
                                        service: group.service || '',
                                        assignedRoles: group.roles ? group.roles.split(',').map(r => r.trim()).filter(Boolean) : [],
                                        accountId: selectedAccountId,
                                        accountName: selectedAccountName,
                                        enterpriseId: selectedEnterpriseId,
                                        enterpriseName: selectedEnterprise
                                    };
                                    
                                    await api.put(`/api/user-management/groups/${groupId}`, updateData);
                                    console.log('✅ Updated database group with user-filled fields:', groupId);
                                } catch (updateError) {
                                    console.warn('⚠️ Could not update group in database, continuing with existing data:', updateError);
                                }
                            } else {
                                // Group is from database with no additional fields - just use its ID
                                console.log('ℹ️ Group is from database with no changes, using existing ID:', groupId);
                            }
                        } else if (groupId && !group.isFromDatabase) {
                            // This is a custom group that happens to match an existing group name
                            // Update it with the custom values
                            try {
                                console.log('🔄 Updating existing group with custom values:', groupId);
                                const updateData = {
                                    description: group.description || '',
                                    entity: group.entity || '',
                                    product: group.product || '',
                                    service: group.service || '',
                                    assignedRoles: group.roles ? group.roles.split(',').map(r => r.trim()).filter(Boolean) : [],
                                    accountId: selectedAccountId,
                                    accountName: selectedAccountName,
                                    enterpriseId: selectedEnterpriseId,
                                    enterpriseName: selectedEnterprise
                                };
                                
                                await api.put(`/api/user-management/groups/${groupId}`, updateData);
                                console.log('✅ Updated existing group:', groupId);
                            } catch (updateError) {
                                console.warn('⚠️ Could not update group in database, continuing with existing data:', updateError);
                            }
                        }

                        if (groupId) {
                            groupIdByLocalId.set(group.id, groupId);
                            // Prevent duplicate group IDs
                            if (groupIds.includes(groupId)) {
                                console.warn('⚠️ Duplicate group ID detected:', groupId, 'for group:', group.groupName);
                                console.warn('⚠️ This group ID was already added. Skipping to avoid duplicates.');
                            } else {
                                groupIds.push(groupId);
                                console.log('✅ Added group ID to assignment list:', groupId, 'for group:', group.groupName);
                            }
                        } else {
                            console.error('❌ Could not get group ID for:', group.groupName, '- group will not be assigned');
                        }
                    } catch (error) {
                        console.error(`❌ Error processing group ${group.groupName}:`, error);
                    }
                }
                
                console.log('📊 Final groupIds to assign:', groupIds);
                console.log('📊 Total unique groups:', groupIds.length);

                // CRITICAL: Always call POST API to replace ALL assignments for this user
                // This ensures deletions are properly reflected (empty array removes all assignments)
                try {
                    console.log(`🔄 Updating user group assignments for user ${actualUserId}`);
                    console.log(`📊 Assigning ${groupIds.length} groups:`, groupIds);
                    
                    // Build query parameters with account and enterprise context
                    const queryParams = new URLSearchParams();
                    if (selectedAccountId) queryParams.append('accountId', selectedAccountId);
                    if (selectedAccountName) queryParams.append('accountName', selectedAccountName);
                    if (selectedEnterpriseId) queryParams.append('enterpriseId', selectedEnterpriseId);
                    if (selectedEnterprise) queryParams.append('enterpriseName', selectedEnterprise);
                    
                    const apiUrl = `/api/user-management/users/${actualUserId}/groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
                    console.log('🌐 [API Call] POSTing user groups to:', apiUrl);
                    
                    const assignPayload = {
                        groupIds: groupIds,
                        userId: actualUserId
                    };
                    console.log('📦 Assign payload:', assignPayload);
                    
                    const assignResponse = await api.post(apiUrl, assignPayload);
                    console.log('📦 Assign response:', assignResponse);
                    console.log('✅ Successfully updated user group assignments in database');
                } catch (assignError) {
                    console.error('❌ Failed to assign groups to user in database:', assignError);
                    console.warn('⚠️ Continuing with local state only - changes may not persist');
                }
            } else if (isTemporaryUser) {
                // User has temporary ID - save to frontend state only
                console.log('⚠️ User has temporary ID, skipping database save. User groups will be saved when user is created.');
            } else {
                console.warn('⚠️ No valid user ID found, cannot save to database');
            }

            // Call parent onSave callback with complete groups only
            // Mark all complete groups as from database since they're now saved
            const completeGroups = userGroups
                .filter(group => isGroupComplete(group))
                .map(group => ({
                    ...group,
                    groupId: groupIdByLocalId.get(group.id) || group.groupId,
                    isFromDatabase: true // Mark as from database after save
                }));
            console.log('📤 Calling onSave with complete groups (all marked as isFromDatabase: true):', completeGroups);
            onSave(completeGroups);
            setHasUnsavedChanges(false);
            setValidationErrors(new Set());
            setShowValidationErrors(false);
            
            // Show success message
            console.log('✅ Successfully saved user groups to state and database');
            
            onClose();
        } catch (error) {
            console.error('❌ Error saving user groups:', error);
            alert('Failed to save user groups. Please try again.');
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
    const [compressingGroupId, setCompressingGroupId] = useState<string | null>(null);
    const [foldingGroupId, setFoldingGroupId] = useState<string | null>(null);

    // Start row compression animation - Match ManageUsersTable exactly
    const startRowCompressionAnimation = async (groupId: string) => {
        console.log('🎬 Starting squeeze animation for user group:', groupId);

        // Step 1: Squeeze the row horizontally with animation
        setCompressingGroupId(groupId);

        // Wait for squeeze animation
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 2: Fade out the row
        setFoldingGroupId(groupId);
        setCompressingGroupId(null);

        // Wait for fade animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 3: Show confirmation modal
        setPendingDeleteGroupId(groupId);
        setShowDeleteConfirmation(true);
        setFoldingGroupId(null);
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
            
            // Remove from userGroups
            const updatedGroups = userGroups.filter(group => group.id !== pendingDeleteGroupId);
            setUserGroups(updatedGroups);
            
            // Remove from selectedUserGroups
            setSelectedUserGroups(prev => prev.filter(group => group.id !== pendingDeleteGroupId));
            
            // Remove from auto-filled groups tracking
            autoFilledGroupsRef.current.delete(pendingDeleteGroupId);
            console.log('🧹 Removed deleted group from auto-filled tracking:', pendingDeleteGroupId);
            
            // Close modal and reset state
            setShowDeleteConfirmation(false);
            setPendingDeleteGroupId(null);
            setCompressingGroupId(null);
            setFoldingGroupId(null);
        } catch (error) {
            console.error('❌ Failed to delete user group:', error);
        } finally {
            setDeletingGroup(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirmation(false);
        setPendingDeleteGroupId(null);
        setCompressingGroupId(null);
        setFoldingGroupId(null);
    };

    if (!isOpen) return null;

    const handleGroupPanelClick = () => {
        if (showRolesModal) {
            handleCloseRolesModal();
        }
    };

    return (
        <div
            className="fixed inset-0 overflow-hidden"
            style={{ zIndex: 9999 + stackLevel }}
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => {
                    if (showRolesModal) {
                        handleCloseRolesModal();
                    } else {
                        handleClose();
                    }
                }}
            />
            
            {/* Modal Panel */}
            <motion.div 
                className="absolute right-0 top-0 h-screen w-[920px] shadow-2xl border-l border-gray-200 flex overflow-hidden"
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
                    className={`w-10 bg-slate-800 text-white flex flex-col relative h-screen ${showRolesModal ? 'cursor-pointer hover:brightness-110' : ''}`}
                    onClick={handleGroupPanelClick}
                    title={showRolesModal ? 'Click to return to Assign User Groups' : undefined}
                >
                    <img 
                        src="/images/logos/sidebar.png" 
                        alt="Sidebar" 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Middle Text - Rotated and Bold */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
                        <div className="flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide">
                            <Users className="h-4 w-4" />
                            <span>Assign User Groups</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white overflow-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-base">Configure User Groups</p>
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
                        
                        {/* User Info */}
                        <div className="mt-4 flex gap-3">
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">First Name</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{firstName || '\u00A0'}</div>
                                </div>
                            </div>
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">Last Name</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{lastName || '\u00A0'}</div>
                                </div>
                            </div>
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">Email Address</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{emailAddress || '\u00A0'}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Selected Groups Count */}
                        <div className="mt-3">
                            <div className="text-blue-100 text-sm">
                                Assigned Groups: <span className="font-semibold text-white">{userGroups.filter(group => isGroupComplete(group)).length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar - Match ManageUsersTable exactly */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left side - Create New User Group Button and Global Search */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addNewUserGroup();
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Create New User Group</span>
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
                                    Loading Assigned User Group Configurations
                                </h3>
                                <p className='mt-2 text-sm text-slate-500'>
                                    Please wait while we fetch your data...
                                </p>
                            </div>
                        </div>
                    ) : userGroups.length === 0 ? (
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
                                    No User Groups Configured
                                </h3>
                                <p className='mt-2 text-sm text-slate-500'>
                                    No user groups have been created yet. Create a new user group to get started.
                                </p>
                                <div className='mt-6'>
                                    <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addNewUserGroup();
                                    }}
                                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Create New User Group</span>
                                </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* AssignedUserGroupTable Component - Only show when groups exist and not loading */
                        <AssignedUserGroupTable
                            userGroups={userGroups}
                            onUpdateUserGroups={handleUpdateUserGroups}
                            searchQuery={appliedSearchTerm}
                            onDeleteClick={handleDeleteClick}
                            compressingGroupId={compressingGroupId}
                            foldingGroupId={foldingGroupId}
                            selectedEnterprise={selectedEnterprise}
                            selectedEnterpriseId={selectedEnterpriseId}
                            selectedAccountId={selectedAccountId}
                            selectedAccountName={selectedAccountName}
                            validationErrors={validationErrors}
                            showValidationErrors={showValidationErrors}
                            onAddNewRow={addNewUserGroup}
                            availableGroups={availableGroups}
                            onOpenRolesModal={handleOpenRolesModal}
                        />
                    )}
                </div>
            </motion.div>

            {selectedGroupForRoles && (
                <AssignedUserRoleModal
                    stackLevel={stackLevel + 1}
                    isOpen={showRolesModal}
                    onClose={handleCloseRolesModal}
                    onSave={handleSaveRolesFromModal}
                    groupName={selectedGroupForRoles.groupName}
                    groupDescription={selectedGroupForRoles.description || ''}
                    groupId={selectedGroupForRoles.groupId}
                    initialUserRoles={selectedGroupForRoles.assignedRoles || []}
                    selectedEnterprise={selectedEnterprise}
                    selectedEnterpriseId={selectedEnterpriseId}
                    selectedAccountId={selectedAccountId}
                    selectedAccountName={selectedAccountName}
                />
            )}

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

            {/* Delete Confirmation Modal - Match ManageUsersTable exactly */}
            {showDeleteConfirmation && (
                <div className='fixed inset-0 z-[10001] overflow-y-auto'>
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
                                            Are you sure you want to delete this user group?
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

export default AssignedUserGroupModal;