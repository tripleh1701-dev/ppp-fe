'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface IntegrationArtifactRow {
    id: string;
    artifactName: string;
    type: string;
    version: string;
    syncedBy: string;
    syncedOn: string; // ISO date string or formatted date
    isPackage?: boolean; // True if this is a parent package row
    artifacts?: IntegrationArtifactRow[]; // Child artifacts (IFLOW, VALUE MAPPING, SCRIPT COLLECTION)
}

interface IntegrationArtifactsTableProps {
    artifacts: IntegrationArtifactRow[];
    onDelete?: (id: string) => void;
    searchQuery?: string;
    selectedArtifacts?: string[]; // Array of selected artifact IDs
    onSelectionChange?: (selectedIds: string[]) => void; // Callback when selection changes
    disabled?: boolean; // If true, checkboxes are disabled (build has been triggered)
}

const IntegrationArtifactsTable: React.FC<IntegrationArtifactsTableProps> = ({
    artifacts,
    onDelete,
    searchQuery = '',
    selectedArtifacts = [],
    onSelectionChange,
    disabled = false,
}) => {
    const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
    const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set(selectedArtifacts));
    const prevSelectedArtifactsRef = React.useRef<string[]>(selectedArtifacts);

    // Filter artifacts based on search query (including nested artifacts)
    const filteredArtifacts = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return artifacts;
        }
        const query = searchQuery.toLowerCase();
        return artifacts.filter((artifact) => {
            // Check if package matches
            const packageMatches = 
                artifact.artifactName?.toLowerCase().includes(query) ||
                artifact.type?.toLowerCase().includes(query) ||
                artifact.version?.toLowerCase().includes(query) ||
                artifact.syncedBy?.toLowerCase().includes(query);
            
            // Check if any child artifact matches
            const childMatches = artifact.artifacts?.some(child =>
                child.artifactName?.toLowerCase().includes(query) ||
                child.type?.toLowerCase().includes(query) ||
                child.version?.toLowerCase().includes(query)
            );
            
            return packageMatches || childMatches;
        });
    }, [artifacts, searchQuery]);

    // Sync internal selection with prop changes
    React.useEffect(() => {
        // Only sync if props actually changed
        const propsChanged = JSON.stringify(prevSelectedArtifactsRef.current.sort()) !== 
                            JSON.stringify([...selectedArtifacts].sort());
        
        if (propsChanged) {
            setInternalSelected(new Set(selectedArtifacts));
            prevSelectedArtifactsRef.current = selectedArtifacts;
        }
    }, [selectedArtifacts]);

    // Toggle package expansion
    const togglePackage = (packageId: string) => {
        setExpandedPackages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(packageId)) {
                newSet.delete(packageId);
            } else {
                newSet.add(packageId);
            }
            return newSet;
        });
    };

    // Handle checkbox selection
    const handleCheckboxChange = (artifactId: string, isPackage: boolean, childIds?: string[], parentId?: string) => {
        setInternalSelected(prev => {
            const newSet = new Set(prev);
            const isCurrentlySelected = newSet.has(artifactId);

            if (isPackage) {
                // If it's a package, toggle package and all its children
                if (isCurrentlySelected) {
                    // Deselect package and all children
                    newSet.delete(artifactId);
                    if (childIds) {
                        childIds.forEach(id => newSet.delete(id));
                    }
                } else {
                    // Select package and all children
                    newSet.add(artifactId);
                    if (childIds) {
                        childIds.forEach(id => newSet.add(id));
                    }
                }
            } else {
                // If it's a child artifact, toggle it
                if (isCurrentlySelected) {
                    // Child is being unselected
                    newSet.delete(artifactId);
                    
                    // After unselecting a child, check if all remaining siblings are still selected
                    // If not all siblings are selected, uncheck the parent
                    if (parentId && childIds) {
                        const allSiblingsSelected = childIds.every(id => newSet.has(id));
                        if (!allSiblingsSelected && newSet.has(parentId)) {
                            // Not all siblings are selected, uncheck the parent
                            newSet.delete(parentId);
                        }
                    }
                } else {
                    // Child is being selected
                    newSet.add(artifactId);
                    // Note: Parent is not automatically selected when all children are selected
                    // User must manually select the parent if desired
                }
            }

            // Notify parent component after state update (defer to avoid render-phase update)
            setTimeout(() => {
                if (onSelectionChange) {
                    onSelectionChange(Array.from(newSet));
                }
            }, 0);

            return newSet;
        });
    };

    // Check if artifact is selected
    const isArtifactSelected = (artifactId: string): boolean => {
        return internalSelected.has(artifactId);
    };

    // Check if package has all children selected (for indeterminate state)
    const areAllChildrenSelected = (childIds: string[]): boolean => {
        return childIds.length > 0 && childIds.every(id => internalSelected.has(id));
    };

    // Check if package has some children selected (for indeterminate state)
    const areSomeChildrenSelected = (childIds: string[]): boolean => {
        return childIds.length > 0 && childIds.some(id => internalSelected.has(id)) && !areAllChildrenSelected(childIds);
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="flex-1 overflow-auto overflow-x-auto">
            <div className="min-w-full" style={{ minWidth: 'max-content' }}>
                {/* Table Header - Show only when rows exist */}
                {filteredArtifacts.length > 0 && (
                    <div
                        className="sticky top-0 z-30 grid w-full gap-0 px-0 py-3 text-xs font-bold text-slate-800 bg-slate-50 border-b border-slate-200 shadow-sm"
                        style={{
                            gridTemplateColumns: '40px 250px 150px 120px 150px 180px 100px',
                            minWidth: 'max-content',
                            width: '100%',
                            display: 'grid',
                        }}
                    >
                        {/* Checkbox Column Header */}
                        <div className="relative flex items-center justify-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className="flex items-center gap-2">
                                {/* Select All checkbox */}
                                <input
                                    type="checkbox"
                                    disabled={disabled}
                                    checked={filteredArtifacts.length > 0 && filteredArtifacts.every(artifact => {
                                        if (artifact.isPackage && artifact.artifacts) {
                                            const allSelected = internalSelected.has(artifact.id) && 
                                                artifact.artifacts.every(child => internalSelected.has(child.id));
                                            return allSelected;
                                        }
                                        return internalSelected.has(artifact.id);
                                    })}
                                    onChange={(e) => {
                                        const allIds: string[] = [];
                                        filteredArtifacts.forEach(artifact => {
                                            allIds.push(artifact.id);
                                            if (artifact.artifacts) {
                                                artifact.artifacts.forEach(child => allIds.push(child.id));
                                            }
                                        });

                                        if (e.target.checked) {
                                            // Select all
                                            const newSet = new Set([...Array.from(internalSelected), ...allIds]);
                                            setInternalSelected(newSet);
                                            // Notify parent component after state update (defer to avoid render-phase update)
                                            if (onSelectionChange) {
                                                setTimeout(() => {
                                                    onSelectionChange(Array.from(newSet));
                                                }, 0);
                                            }
                                        } else {
                                            // Deselect all
                                            const newSet = new Set(internalSelected);
                                            allIds.forEach(id => newSet.delete(id));
                                            setInternalSelected(newSet);
                                            // Notify parent component after state update (defer to avoid render-phase update)
                                            if (onSelectionChange) {
                                                setTimeout(() => {
                                                    onSelectionChange(Array.from(newSet));
                                                }, 0);
                                            }
                                        }
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                        
                        {/* Column Headers */}
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className="flex items-center gap-2">
                                <span>Artifact Name</span>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className="flex items-center gap-2">
                                <span>Type</span>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className="flex items-center gap-2">
                                <span>Version</span>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className="flex items-center gap-2">
                                <span>Synced By</span>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className="flex items-center gap-2">
                                <span>Synced On</span>
                            </div>
                        </div>
                        <div className="relative flex items-center justify-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2">
                                <span>Actions</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table Rows */}
                <div className="bg-white">
                    {filteredArtifacts.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                            {searchQuery.trim() ? 'No artifacts found matching your search.' : 'No artifacts available.'}
                        </div>
                    ) : (
                        filteredArtifacts.map((artifact, index) => {
                            const isExpanded = expandedPackages.has(artifact.id);
                            const hasChildren = artifact.isPackage && artifact.artifacts && artifact.artifacts.length > 0;
                            const rowIndex = index;

                            return (
                                <React.Fragment key={artifact.id}>
                                    {/* Parent Package Row */}
                                    <div
                                        className="grid w-full gap-0 px-0 text-sm border-b border-slate-200 hover:bg-blue-50/30 transition-colors duration-150"
                                        style={{
                                            gridTemplateColumns: '40px 250px 150px 120px 150px 180px 100px',
                                            minWidth: 'max-content',
                                            width: '100%',
                                            display: 'grid',
                                            backgroundColor: rowIndex % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)',
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <div className="group flex items-center justify-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                            <input
                                                type="checkbox"
                                                disabled={disabled}
                                                checked={isArtifactSelected(artifact.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    const childIds = artifact.artifacts?.map(child => child.id) || [];
                                                    handleCheckboxChange(artifact.id, true, childIds);
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        {/* Artifact Name with Expand/Collapse Arrow */}
                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                            <div className="flex items-center gap-2 text-slate-700 font-normal text-[12px] w-full flex-1">
                                                {hasChildren ? (
                                                    <button
                                                        onClick={() => togglePackage(artifact.id)}
                                                        className="flex items-center justify-center w-5 h-5 hover:bg-blue-100 rounded transition-colors"
                                                        title={isExpanded ? 'Collapse' : 'Expand'}
                                                    >
                                                        <motion.div
                                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <ChevronRight size={14} className="text-slate-600" />
                                                        </motion.div>
                                                    </button>
                                                ) : (
                                                    <div className="w-5" /> // Spacer for alignment
                                                )}
                                                <span className="truncate font-medium">
                                                    {artifact.artifactName || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Type */}
                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                            <div className="flex items-center text-slate-700 font-normal text-[12px] w-full flex-1 truncate">
                                                {artifact.type || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Version */}
                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                            <div className="flex items-center text-slate-700 font-normal text-[12px] w-full flex-1 truncate">
                                                {artifact.version || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Synced By */}
                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                            <div className="flex items-center text-slate-700 font-normal text-[12px] w-full flex-1 truncate">
                                                {artifact.syncedBy || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Synced On */}
                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                            <div className="flex items-center text-slate-700 font-normal text-[12px] w-full flex-1 truncate">
                                                {formatDate(artifact.syncedOn)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="group flex items-center justify-center gap-1.5 px-2 py-2 w-full overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                {onDelete && !artifact.isPackage && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(artifact.id);
                                                        }}
                                                        className="p-1.5 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
                                                        title="Actions"
                                                    >
                                                        <span className="font-bold text-lg">...</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Child Artifacts (IFLOW, VALUE MAPPING, SCRIPT COLLECTION) */}
                                    {hasChildren && isExpanded && (
                                        <AnimatePresence>
                                            {artifact.artifacts?.map((childArtifact, childIndex) => {
                                                // Filter child artifacts based on search query if needed
                                                if (searchQuery.trim()) {
                                                    const query = searchQuery.toLowerCase();
                                                    const matches = 
                                                        childArtifact.artifactName?.toLowerCase().includes(query) ||
                                                        childArtifact.type?.toLowerCase().includes(query) ||
                                                        childArtifact.version?.toLowerCase().includes(query);
                                                    if (!matches) return null;
                                                }

                                                return (
                                                    <motion.div
                                                        key={childArtifact.id}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="grid w-full gap-0 px-0 text-sm border-b border-slate-200 hover:bg-blue-50/30 transition-colors duration-150 bg-slate-50/50"
                                                        style={{
                                                            gridTemplateColumns: '40px 250px 150px 120px 150px 180px 100px',
                                                            minWidth: 'max-content',
                                                            width: '100%',
                                                            display: 'grid',
                                                        }}
                                                    >
                                                        {/* Checkbox */}
                                                        <div className="group flex items-center justify-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                                            <input
                                                                type="checkbox"
                                                                disabled={disabled}
                                                                checked={isArtifactSelected(childArtifact.id)}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    const childIds = artifact.artifacts?.map(child => child.id) || [];
                                                                    handleCheckboxChange(childArtifact.id, false, childIds, artifact.id);
                                                                }}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            />
                                                        </div>

                                                        {/* Artifact Name with Indentation */}
                                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                                            <div className="flex items-center text-slate-600 font-normal text-[12px] w-full flex-1 pl-10">
                                                                <span className="truncate">
                                                                    {(childArtifact.artifactName || 'N/A').replace(/^-+\s*/, '')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Type */}
                                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                                            <div className="flex items-center text-slate-600 font-normal text-[12px] w-full flex-1 truncate">
                                                                {(childArtifact.type || 'N/A').replace(/^-+\s*/, '')}
                                                            </div>
                                                        </div>

                                                        {/* Version */}
                                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                                            <div className="flex items-center text-slate-600 font-normal text-[12px] w-full flex-1 truncate">
                                                                {(childArtifact.version || 'N/A').replace(/^-+\s*/, '')}
                                                            </div>
                                                        </div>

                                                        {/* Synced By */}
                                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                                            <div className="flex items-center text-slate-600 font-normal text-[12px] w-full flex-1 truncate">
                                                                {(childArtifact.syncedBy || 'N/A').replace(/^-+\s*/, '')}
                                                            </div>
                                                        </div>

                                                        {/* Synced On */}
                                                        <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-2 w-full overflow-hidden">
                                                            <div className="flex items-center text-slate-600 font-normal text-[12px] w-full flex-1 truncate">
                                                                {formatDate(childArtifact.syncedOn)}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="group flex items-center justify-center gap-1.5 px-2 py-2 w-full overflow-hidden">
                                                            <div className="flex items-center gap-2">
                                                                {onDelete && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDelete(childArtifact.id);
                                                                        }}
                                                                        className="p-1.5 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
                                                                        title="Actions"
                                                                    >
                                                                        <span className="font-bold text-lg">...</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntegrationArtifactsTable;

