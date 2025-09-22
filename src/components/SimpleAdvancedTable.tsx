'use client';

import React from 'react';
import AdvancedTable from './AdvancedTable';
import {useAdvancedTable} from '@/hooks/useAdvancedTable';
import {COLUMN_TYPES} from '@/config/AdvancedTableConfig';

interface TableColumn {
    id: string;
    title: string;
    type: keyof typeof COLUMN_TYPES;
    width?: number;
    resizable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
    required?: boolean;
    options?: any[];
    validation?: any;
    [key: string]: any;
}

interface TableRow {
    id: string;
    parentId?: string;
    isExpanded?: boolean;
    children?: TableRow[];
    [key: string]: any;
}

interface SimpleAdvancedTableProps {
    tableName: string;
    columns: TableColumn[];
    data: TableRow[];
    config?: any;
    onDataChange?: (data: TableRow[]) => void;
    onRowAction?: (action: string, row: TableRow) => void;
    onBulkAction?: (action: string, rows: TableRow[]) => void;
    onInlineEdit?: (rowId: string, field: string, value: any) => void;
    className?: string;
}

/**
 * SimpleAdvancedTable - Easy-to-use wrapper for AdvancedTable
 *
 * This component automatically handles:
 * - Column configuration from COLUMN_TYPES
 * - State management via useAdvancedTable hook
 * - Default configurations
 *
 * @example
 * const columns = [
 *   { id: 'name', title: 'Name', type: 'text' },
 *   { id: 'email', title: 'Email', type: 'email' },
 *   { id: 'status', title: 'Status', type: 'select', options: ['Active', 'Inactive'] },
 * ];
 *
 * const data = [
 *   { id: '1', name: 'John Doe', email: 'john@example.com', status: 'Active' },
 *   { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
 * ];
 *
 * <SimpleAdvancedTable
 *   tableName="Users"
 *   columns={columns}
 *   data={data}
 *   onDataChange={(newData) => console.log('Data changed:', newData)}
 * />
 */
const SimpleAdvancedTable: React.FC<SimpleAdvancedTableProps> = ({
    tableName,
    columns: userColumns,
    data: initialData,
    config = {},
    onDataChange,
    onRowAction,
    onBulkAction,
    onInlineEdit,
    className,
}) => {
    // Enhance columns with default configurations from COLUMN_TYPES
    const enhancedColumns = userColumns.map((column, index) => {
        const defaultConfig = COLUMN_TYPES[column.type] || COLUMN_TYPES.text;

        return {
            ...defaultConfig,
            ...column,
            order: column.order ?? index,
            width: column.width ?? defaultConfig.width,
        };
    });

    // Add checkbox column if not present
    const finalColumns = enhancedColumns.some((col) => col.type === 'checkbox')
        ? enhancedColumns
        : [
              {
                  id: 'checkbox',
                  title: '',
                  type: 'checkbox' as const,
                  width: 40,
                  resizable: false,
                  sortable: false,
                  filterable: false,
                  editable: false,
                  order: -1,
              },
              ...enhancedColumns,
          ];

    // Sort columns by order
    finalColumns.sort((a, b) => a.order - b.order);

    // Use the advanced table hook
    const {
        data,
        filteredData,
        selectedRows,
        isLoading,
        searchTerm,
        setSearchTerm,
        setSelectedRows,
        handleRowSelect,
        handleSelectAll,
        handleToggleExpand,
        handleInlineEdit,
        handleSort,
        handleRowAction: hookRowAction,
        handleBulkAction: hookBulkAction,
        tableConfig,
    } = useAdvancedTable({
        initialData,
        columns: finalColumns,
        config,
        onDataChange,
    });

    // Combine hook handlers with user handlers
    const combinedRowAction = (action: string, row: TableRow) => {
        hookRowAction(action, row);
        onRowAction?.(action, row);
    };

    const combinedBulkAction = (action: string, rows: TableRow[]) => {
        hookBulkAction(action, rows);
        onBulkAction?.(action, rows);
    };

    const combinedInlineEdit = (rowId: string, field: string, value: any) => {
        handleInlineEdit(rowId, field, value);
        onInlineEdit?.(rowId, field, value);
    };

    return (
        <AdvancedTable
            tableName={tableName}
            columns={finalColumns}
            data={data}
            config={tableConfig}
            onDataChange={onDataChange}
            onRowAction={combinedRowAction}
            onBulkAction={combinedBulkAction}
            onInlineEdit={combinedInlineEdit}
            selectedRows={selectedRows}
            onSelectedRowsChange={setSelectedRows}
            isLoading={isLoading}
            className={className}
        />
    );
};

export default SimpleAdvancedTable;
