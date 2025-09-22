'use client';

import {useState, useCallback, useMemo, useEffect} from 'react';
import {ADVANCED_TABLE_CONFIG} from '@/config/AdvancedTableConfig';

interface TableColumn {
    id: string;
    title: string;
    type: string;
    width: number;
    resizable: boolean;
    sortable: boolean;
    filterable: boolean;
    editable: boolean;
    order: number;
    [key: string]: any;
}

interface TableRow {
    id: string;
    parentId?: string;
    isExpanded?: boolean;
    level?: number;
    children?: TableRow[];
    [key: string]: any;
}

interface UseAdvancedTableProps {
    initialData: TableRow[];
    columns: TableColumn[];
    config?: any;
    onDataChange?: (data: TableRow[]) => void;
    apiEndpoints?: {
        create?: string;
        update?: string;
        delete?: string;
        bulkDelete?: string;
    };
}

interface UseAdvancedTableReturn {
    // Data state
    data: TableRow[];
    filteredData: TableRow[];
    flattenedData: TableRow[];

    // Selection state
    selectedRows: string[];
    allSelected: boolean;
    someSelected: boolean;

    // UI state
    isLoading: boolean;
    searchTerm: string;
    sortStates: Record<string, 'off' | 'asc' | 'desc'>;

    // Actions
    setSearchTerm: (term: string) => void;
    setSelectedRows: (rows: string[]) => void;
    handleRowSelect: (rowId: string, selected: boolean) => void;
    handleSelectAll: (selected: boolean) => void;
    handleToggleExpand: (rowId: string) => void;
    handleInlineEdit: (rowId: string, field: string, value: any) => void;
    handleSort: (columnId: string, direction: 'asc' | 'desc' | 'off') => void;
    handleRowAction: (action: string, row: TableRow) => void;
    handleBulkAction: (action: string, rows: TableRow[]) => void;
    handleAddRow: (newRow: Partial<TableRow>) => void;
    handleDeleteRow: (rowId: string) => void;
    handleUpdateRow: (rowId: string, updates: Partial<TableRow>) => void;

    // Configuration
    tableConfig: any;
}

export const useAdvancedTable = ({
    initialData,
    columns,
    config = {},
    onDataChange,
    apiEndpoints = {},
}: UseAdvancedTableProps): UseAdvancedTableReturn => {
    // Merge configuration
    const tableConfig = useMemo(
        () => ({
            ...ADVANCED_TABLE_CONFIG,
            ...config,
            ui: {
                ...ADVANCED_TABLE_CONFIG.ui,
                ...config.ui,
            },
        }),
        [config],
    );

    // State
    const [data, setData] = useState<TableRow[]>(initialData);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortStates, setSortStates] = useState<
        Record<string, 'off' | 'asc' | 'desc'>
    >({});

    // Update data when initialData changes
    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    // Flatten tree data for rendering
    const flattenedData = useMemo(() => {
        const flatten = (rows: TableRow[], level = 0): TableRow[] => {
            let result: TableRow[] = [];

            for (const row of rows) {
                result.push({...row, level});

                if (row.isExpanded && row.children) {
                    result.push(...flatten(row.children, level + 1));
                }
            }

            return result;
        };

        return flatten(data);
    }, [data]);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return flattenedData;

        return flattenedData.filter((row) =>
            Object.values(row).some(
                (value) =>
                    value &&
                    String(value)
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            ),
        );
    }, [flattenedData, searchTerm]);

    // Selection computed states
    const allSelected =
        selectedRows.length === filteredData.length && filteredData.length > 0;
    const someSelected =
        selectedRows.length > 0 && selectedRows.length < filteredData.length;

    // Helper function to update nested data
    const updateNestedData = useCallback(
        (
            rows: TableRow[],
            updateFn: (row: TableRow) => TableRow | null,
        ): TableRow[] => {
            return rows.reduce((acc: TableRow[], row) => {
                const updatedRow = updateFn(row);
                if (updatedRow === null) {
                    // Row should be deleted
                    return acc;
                }

                if (updatedRow.children) {
                    updatedRow.children = updateNestedData(
                        updatedRow.children,
                        updateFn,
                    );
                }

                acc.push(updatedRow);
                return acc;
            }, []);
        },
        [],
    );

    // Helper function to notify data change
    const notifyDataChange = useCallback(
        (newData: TableRow[]) => {
            setData(newData);
            onDataChange?.(newData);
        },
        [onDataChange],
    );

    // Row selection handlers
    const handleRowSelect = useCallback((rowId: string, selected: boolean) => {
        setSelectedRows((prev) =>
            selected ? [...prev, rowId] : prev.filter((id) => id !== rowId),
        );
    }, []);

    const handleSelectAll = useCallback(
        (selected: boolean) => {
            setSelectedRows(selected ? filteredData.map((row) => row.id) : []);
        },
        [filteredData],
    );

    // Expand/collapse handler
    const handleToggleExpand = useCallback(
        (rowId: string) => {
            const newData = updateNestedData(data, (row) => {
                if (row.id === rowId) {
                    return {...row, isExpanded: !row.isExpanded};
                }
                return row;
            });
            notifyDataChange(newData);
        },
        [data, updateNestedData, notifyDataChange],
    );

    // Inline edit handler
    const handleInlineEdit = useCallback(
        (rowId: string, field: string, value: any) => {
            const newData = updateNestedData(data, (row) => {
                if (row.id === rowId) {
                    return {
                        ...row,
                        [field]: value,
                        updated_at: new Date().toISOString(),
                    };
                }
                return row;
            });
            notifyDataChange(newData);
        },
        [data, updateNestedData, notifyDataChange],
    );

    // Sort handler
    const handleSort = useCallback(
        (columnId: string, direction: 'asc' | 'desc' | 'off') => {
            setSortStates((prev) => ({
                ...prev,
                [columnId]: direction,
            }));

            if (direction === 'off') {
                // Reset to original order
                notifyDataChange([...initialData]);
                return;
            }

            const sortedData = [...data].sort((a, b) => {
                const aVal = a[columnId];
                const bVal = b[columnId];

                if (aVal === bVal) return 0;

                const comparison = aVal < bVal ? -1 : 1;
                return direction === 'asc' ? comparison : -comparison;
            });

            notifyDataChange(sortedData);
        },
        [data, initialData, notifyDataChange],
    );

    // Add new row
    const handleAddRow = useCallback(
        (newRow: Partial<TableRow>) => {
            const rowWithId = {
                id: `row-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...newRow,
            } as TableRow;

            const newData = [...data, rowWithId];
            notifyDataChange(newData);
        },
        [data, notifyDataChange],
    );

    // Update existing row
    const handleUpdateRow = useCallback(
        (rowId: string, updates: Partial<TableRow>) => {
            const newData = updateNestedData(data, (row) => {
                if (row.id === rowId) {
                    return {
                        ...row,
                        ...updates,
                        updated_at: new Date().toISOString(),
                    };
                }
                return row;
            });
            notifyDataChange(newData);
        },
        [data, updateNestedData, notifyDataChange],
    );

    // Delete row
    const handleDeleteRow = useCallback(
        (rowId: string) => {
            const newData = updateNestedData(data, (row) => {
                if (row.id === rowId) {
                    return null; // Mark for deletion
                }
                return row;
            });
            notifyDataChange(newData);

            // Remove from selection if selected
            setSelectedRows((prev) => prev.filter((id) => id !== rowId));
        },
        [data, updateNestedData, notifyDataChange],
    );

    // Row action handler
    const handleRowAction = useCallback(
        (action: string, row: TableRow) => {
            switch (action) {
                case 'edit':
                    // This would typically open an edit modal or form
                    console.log('Edit row:', row);
                    break;
                case 'delete':
                    handleDeleteRow(row.id);
                    break;
                case 'duplicate':
                    const duplicatedRow = {
                        ...row,
                        id: `row-${Date.now()}-${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                        name: `${row.name} (Copy)`,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    handleAddRow(duplicatedRow);
                    break;
                case 'expand':
                    handleToggleExpand(row.id);
                    break;
                case 'create':
                    handleAddRow({
                        name: 'New Item',
                        status: 'Active',
                    });
                    break;
                default:
                    console.log('Unknown action:', action, row);
            }
        },
        [handleDeleteRow, handleAddRow, handleToggleExpand],
    );

    // Bulk action handler
    const handleBulkAction = useCallback(
        (action: string, rows: TableRow[]) => {
            switch (action) {
                case 'delete':
                    const rowIds = rows.map((row) => row.id);
                    const newData = updateNestedData(data, (row) => {
                        return rowIds.includes(row.id) ? null : row;
                    });
                    notifyDataChange(newData);
                    setSelectedRows([]);
                    break;
                case 'activate':
                    const activatedData = updateNestedData(data, (row) => {
                        if (selectedRows.includes(row.id)) {
                            return {
                                ...row,
                                status: 'Active',
                                updated_at: new Date().toISOString(),
                            };
                        }
                        return row;
                    });
                    notifyDataChange(activatedData);
                    break;
                case 'deactivate':
                    const deactivatedData = updateNestedData(data, (row) => {
                        if (selectedRows.includes(row.id)) {
                            return {
                                ...row,
                                status: 'Inactive',
                                updated_at: new Date().toISOString(),
                            };
                        }
                        return row;
                    });
                    notifyDataChange(deactivatedData);
                    break;
                default:
                    console.log('Unknown bulk action:', action, rows);
            }
        },
        [data, selectedRows, updateNestedData, notifyDataChange],
    );

    return {
        // Data state
        data,
        filteredData,
        flattenedData,

        // Selection state
        selectedRows,
        allSelected,
        someSelected,

        // UI state
        isLoading,
        searchTerm,
        sortStates,

        // Actions
        setSearchTerm,
        setSelectedRows,
        handleRowSelect,
        handleSelectAll,
        handleToggleExpand,
        handleInlineEdit,
        handleSort,
        handleRowAction,
        handleBulkAction,
        handleAddRow,
        handleDeleteRow,
        handleUpdateRow,

        // Configuration
        tableConfig,
    };
};

export default useAdvancedTable;
