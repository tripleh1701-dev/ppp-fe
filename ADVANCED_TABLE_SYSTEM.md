# Advanced Table System

## Overview

The Advanced Table System provides a unified, feature-rich table component that can be used consistently across the entire application. It includes all enterprise-grade features like tree structures, drag-and-drop, inline editing, advanced sorting, column resizing, and modern micro-interactions.

## Key Features

### ✨ Core Features
- **Tree Table Structure**: Parent/child relationships with visual connectors
- **Drag & Drop**: Row reordering with smooth animations
- **Column Management**: Resizing, reordering, show/hide
- **Advanced Sorting**: Hover-only sort controls with clear/save pills
- **Inline Editing**: Double-click to edit with auto-save
- **Global Search**: Real-time filtering across all columns
- **Bulk Operations**: Multi-select with bulk actions
- **Export/Import**: CSV, Excel, PDF support

### 🎨 Visual Features
- **Compact Design**: 48px row height for modern look
- **Blue Line Indicators**: 3px left border for selected rows
- **Hover Effects**: Smooth micro-interactions
- **Modern UI**: Rounded corners, shadows, alternating colors
- **Responsive**: Horizontal scrolling for wide tables

### ⚡ Performance Features
- **Virtual Scrolling**: Handle large datasets efficiently
- **Debounced Auto-save**: Batch operations to reduce API calls
- **Lazy Loading**: Load data on demand
- **Optimistic Updates**: Immediate UI feedback

## Architecture

### Core Components

1. **AdvancedTable** - Main component with all features
2. **SimpleAdvancedTable** - Easy-to-use wrapper
3. **useAdvancedTable** - Hook for state management
4. **AdvancedTableConfig** - Centralized configuration

### File Structure

```
src/
├── components/
│   ├── AdvancedTable.tsx          # Main table component
│   └── SimpleAdvancedTable.tsx    # Simplified wrapper
├── hooks/
│   └── useAdvancedTable.tsx       # State management hook
└── config/
    └── AdvancedTableConfig.js     # Global configuration
```

## Usage

### Basic Usage

```tsx
import SimpleAdvancedTable from '@/components/SimpleAdvancedTable';

const columns = [
  { id: 'name', title: 'Name', type: 'text' },
  { id: 'email', title: 'Email', type: 'email' },
  { id: 'status', title: 'Status', type: 'select', options: ['active', 'inactive'] },
];

const data = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
];

<SimpleAdvancedTable
  tableName="Users"
  columns={columns}
  data={data}
  onDataChange={(newData) => console.log('Data changed:', newData)}
/>
```

### Advanced Usage with Tree Structure

```tsx
const treeData = [
  {
    id: '1',
    name: 'Parent Item 1',
    isExpanded: true,
    children: [
      { id: '1-1', parentId: '1', name: 'Child Item 1.1' },
      { id: '1-2', parentId: '1', name: 'Child Item 1.2' },
    ],
  },
  {
    id: '2',
    name: 'Parent Item 2',
    isExpanded: false,
    children: [
      { id: '2-1', parentId: '2', name: 'Child Item 2.1' },
    ],
  },
];

<SimpleAdvancedTable
  tableName="Hierarchical Data"
  columns={columns}
  data={treeData}
  config={{
    ui: {
      enableTreeView: true,
      showTreeConnectors: true,
    },
  }}
/>
```

### Custom Configuration

```tsx
const customConfig = {
  ui: {
    defaultRowHeight: 32,
    compactMode: false,
    theme: {
      primaryColor: '#8b5cf6',
      rowHoverColor: '#f3f4f6',
    },
  },
  features: {
    enableSelection: true,
    enableInlineEdit: true,
    autoSave: true,
    autoSaveDelay: 500,
  },
};

<SimpleAdvancedTable
  tableName="Custom Table"
  columns={columns}
  data={data}
  config={customConfig}
/>
```

## Column Types

### Available Types

```typescript
// Text column
{ id: 'name', title: 'Name', type: 'text', width: 120, editable: true }

// Email column with validation
{ id: 'email', title: 'Email', type: 'email', width: 160, editable: true }

// Select dropdown
{ id: 'status', title: 'Status', type: 'select', options: ['active', 'inactive'] }

// Date/datetime picker
{ id: 'created', title: 'Created', type: 'date', width: 110 }

// Number input
{ id: 'count', title: 'Count', type: 'number', width: 80 }

// Checkbox (auto-added for selection)
{ id: 'checkbox', title: '', type: 'checkbox', width: 40, resizable: false }

// Toggle switch
{ id: 'enabled', title: 'Enabled', type: 'toggle', width: 80 }

// Password field
{ id: 'password', title: 'Password', type: 'password', width: 90 }

// User group selector
{ id: 'group', title: 'Group', type: 'userGroup', width: 130 }
```

### Column Properties

```typescript
interface TableColumn {
  id: string;              // Unique identifier
  title: string;           // Display name
  type: string;            // Column type
  width?: number;          // Column width (px)
  resizable?: boolean;     // Can be resized
  sortable?: boolean;      // Can be sorted
  filterable?: boolean;    // Can be filtered
  editable?: boolean;      // Can be edited inline
  required?: boolean;      // Required field
  options?: any[];         // Options for select/dropdown
  validation?: any;        // Validation rules
  order?: number;          // Display order
}
```

## Event Handlers

### Data Change Events

```tsx
const handleDataChange = (newData: TableRow[]) => {
  console.log('Table data changed:', newData);
  // Update your state or call API
};

const handleRowAction = (action: string, row: TableRow) => {
  switch (action) {
    case 'edit':
      openEditModal(row);
      break;
    case 'delete':
      deleteRow(row.id);
      break;
    case 'create':
      openCreateModal();
      break;
  }
};

const handleBulkAction = (action: string, rows: TableRow[]) => {
  switch (action) {
    case 'delete':
      deleteMultipleRows(rows.map(r => r.id));
      break;
    case 'activate':
      updateMultipleRows(rows, { status: 'active' });
      break;
  }
};

const handleInlineEdit = (rowId: string, field: string, value: any) => {
  console.log(`Updated ${field} to ${value} for row ${rowId}`);
  // Auto-save to backend
};
```

## State Management Hook

### useAdvancedTable Hook

```tsx
import { useAdvancedTable } from '@/hooks/useAdvancedTable';

const {
  data,
  filteredData,
  selectedRows,
  isLoading,
  searchTerm,
  setSearchTerm,
  handleRowSelect,
  handleSelectAll,
  handleToggleExpand,
  handleInlineEdit,
  handleSort,
  handleRowAction,
  handleBulkAction,
} = useAdvancedTable({
  initialData: myData,
  columns: myColumns,
  config: myConfig,
});
```

## Configuration Options

### UI Configuration

```javascript
ui: {
  // Table appearance
  showTableTitle: true,
  enableDragAndDrop: true,
  enableColumnResize: true,
  enableColumnReorder: true,
  enableSearch: true,
  enableFilter: true,
  enableExport: true,
  showAutoSaveIndicator: true,

  // Layout
  enableHorizontalScroll: true,
  defaultRowHeight: 20,
  compactMode: true,
  alternatingRowColors: true,
  headerHeight: 25,

  // Interactions
  cellEditMode: 'hover', // 'hover', 'click', 'doubleClick'
  enableHoverEdit: true,
  hoverEditDelay: 200,

  // Tree features
  enableTreeView: true,
  showTreeConnectors: true,
  treeIndentSize: 20,

  // Sorting
  enableAdvancedSort: true,
  sortMode: 'hover',
  showSortPills: true,
  multiColumnSort: true,

  // Theme colors
  theme: {
    primaryColor: '#0070f3',
    rowHoverColor: '#f0f8ff',
    selectedRowColor: '#dbeafe',
    rowIndicatorColor: '#3b82f6',
    // ... more theme options
  },
}
```

### Feature Configuration

```javascript
features: {
  enableSelection: true,
  enableSelectAll: true,
  selectionMode: 'multiple',
  enableInlineEdit: true,
  editTrigger: 'doubleClick',
  autoSave: true,
  autoSaveDelay: 1000,
  enableExpandCollapse: true,
  enableGlobalSearch: true,
  enableColumnFilters: true,
  virtualScrolling: true,
  lazyLoading: true,
}
```

## Examples

### 1. User Management Table

```tsx
<SimpleAdvancedTable
  tableName="Manage Users"
  columns={[
    { id: 'firstName', title: 'First Name', type: 'text', editable: true },
    { id: 'lastName', title: 'Last Name', type: 'text', editable: true },
    { id: 'email', title: 'Email', type: 'email', editable: true },
    { id: 'status', title: 'Status', type: 'select', options: ['active', 'inactive'] },
    { id: 'role', title: 'Role', type: 'userGroup', editable: true },
    { id: 'created_at', title: 'Created', type: 'date', editable: false },
  ]}
  data={users}
  onDataChange={setUsers}
  onRowAction={handleUserAction}
  onBulkAction={handleBulkUserAction}
/>
```

### 2. Product Catalog with Tree Structure

```tsx
<SimpleAdvancedTable
  tableName="Product Catalog"
  columns={[
    { id: 'name', title: 'Product Name', type: 'text', editable: true },
    { id: 'category', title: 'Category', type: 'select', options: categories },
    { id: 'price', title: 'Price', type: 'number', editable: true },
    { id: 'stock', title: 'Stock', type: 'number', editable: true },
    { id: 'status', title: 'Status', type: 'toggle', editable: true },
  ]}
  data={productTree}
  config={{
    ui: {
      enableTreeView: true,
      showTreeConnectors: true,
    },
  }}
/>
```

### 3. Enterprise Configuration

```tsx
<SimpleAdvancedTable
  tableName="Enterprise Configuration"
  columns={[
    { id: 'enterprise', title: 'Enterprise', type: 'select', options: enterprises },
    { id: 'product', title: 'Product', type: 'select', options: products },
    { id: 'services', title: 'Services', type: 'userGroup', editable: true },
  ]}
  data={configurations}
  config={{
    features: {
      autoSave: true,
      autoSaveDelay: 500,
    },
  }}
/>
```

## Migration Guide

### From Old Tables to Advanced Tables

1. **Replace imports**:
   ```tsx
   // Old
   import ReusableTableComponent from '@/components/reusable/ReusableTableComponent';
   
   // New
   import SimpleAdvancedTable from '@/components/SimpleAdvancedTable';
   ```

2. **Update column definitions**:
   ```tsx
   // Old
   const columns = ManageUsers_tableConfig.mainTableColumns;
   
   // New
   const columns = [
     { id: 'name', title: 'Name', type: 'text', editable: true },
     { id: 'email', title: 'Email', type: 'email', editable: true },
   ];
   ```

3. **Simplify component usage**:
   ```tsx
   // Old
   <ReusableTableComponent
     config={{
       ...ManageUsers_tableConfig,
       initialData: data,
       actions: { /* complex config */ },
     }}
   />
   
   // New
   <SimpleAdvancedTable
     tableName="Users"
     columns={columns}
     data={data}
     onDataChange={setData}
   />
   ```

## Best Practices

### Performance
- Use `virtualScrolling: true` for large datasets (>1000 rows)
- Enable `lazyLoading: true` for API-driven data
- Set appropriate `autoSaveDelay` (500-1000ms)

### UX
- Keep column widths reasonable (80-200px)
- Use appropriate column types for data
- Provide clear action button tooltips
- Use tree structure for hierarchical data

### Accessibility
- Always provide meaningful column titles
- Use proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

## Troubleshooting

### Common Issues

1. **Data not updating**: Ensure `onDataChange` is properly connected
2. **Columns not resizing**: Check `resizable: true` in column config
3. **Inline edit not working**: Verify `editable: true` and double-click trigger
4. **Tree not expanding**: Ensure `isExpanded` and `children` properties exist
5. **Sort not working**: Check `sortable: true` in column config

### Debug Mode

Enable debug logging:
```tsx
const config = {
  debug: true,
  ui: {
    // ... other config
  },
};
```

## Future Enhancements

- **Real-time collaboration**: Multiple users editing simultaneously
- **Advanced filtering**: Date ranges, number ranges, custom filters
- **Column templates**: Pre-defined column configurations
- **Data validation**: Client-side validation with error highlighting
- **Keyboard shortcuts**: Power user features
- **Mobile optimization**: Touch-friendly interactions

---

This Advanced Table System provides a consistent, powerful foundation for all tables across the application while maintaining ease of use and extensibility.
