# Quick Table Implementation Guide

## 🚀 Replace Any Table in 5 Minutes

### Step 1: Import the Component
```tsx
import SimpleAdvancedTable from '@/components/SimpleAdvancedTable';
```

### Step 2: Define Your Columns
```tsx
const columns = [
    { id: 'name', title: 'Name', type: 'text', editable: true },
    { id: 'email', title: 'Email', type: 'email', editable: true },
    { id: 'status', title: 'Status', type: 'select', options: ['active', 'inactive'] },
    { id: 'created_at', title: 'Created', type: 'date', editable: false },
];
```

### Step 3: Add the Component
```tsx
<SimpleAdvancedTable
    tableName="Your Table Name"
    columns={columns}
    data={yourData}
    onDataChange={setYourData}
/>
```

### That's it! ✨

You now have:
- ✅ Column resizing & reordering
- ✅ Drag & drop row reordering  
- ✅ Inline editing on double-click
- ✅ Advanced sorting with hover pills
- ✅ Global search & filtering
- ✅ Bulk selection & operations
- ✅ Blue line row indicators
- ✅ Compact modern design
- ✅ Auto-save functionality
- ✅ Export capabilities

---

## 🎯 Common Use Cases

### 1. User Management Table
```tsx
const userColumns = [
    { id: 'firstName', title: 'First Name', type: 'text' },
    { id: 'lastName', title: 'Last Name', type: 'text' },
    { id: 'email', title: 'Email', type: 'email' },
    { id: 'role', title: 'Role', type: 'select', options: ['admin', 'user'] },
    { id: 'status', title: 'Status', type: 'toggle' },
    { id: 'lastLogin', title: 'Last Login', type: 'date' },
];
```

### 2. Product Catalog with Tree Structure
```tsx
const productColumns = [
    { id: 'name', title: 'Product Name', type: 'text' },
    { id: 'category', title: 'Category', type: 'select' },
    { id: 'price', title: 'Price', type: 'number' },
    { id: 'stock', title: 'Stock', type: 'number' },
    { id: 'active', title: 'Active', type: 'toggle' },
];

// Tree data structure
const treeData = [
    {
        id: '1',
        name: 'Electronics',
        isExpanded: true,
        children: [
            { id: '1-1', parentId: '1', name: 'Laptops', price: 999 },
            { id: '1-2', parentId: '1', name: 'Phones', price: 699 },
        ],
    },
];
```

### 3. Configuration Management
```tsx
const configColumns = [
    { id: 'key', title: 'Configuration Key', type: 'text' },
    { id: 'value', title: 'Value', type: 'text' },
    { id: 'type', title: 'Type', type: 'select', options: ['string', 'number', 'boolean'] },
    { id: 'environment', title: 'Environment', type: 'select', options: ['dev', 'staging', 'prod'] },
    { id: 'lastModified', title: 'Last Modified', type: 'date' },
];
```

---

## 🔧 Column Types Reference

| Type | Use Case | Properties |
|------|----------|------------|
| `text` | General text input | `maxLength`, `validation` |
| `email` | Email addresses | Auto-validation |
| `number` | Numeric values | `min`, `max`, `step` |
| `select` | Dropdowns | `options: string[]` |
| `date` | Date/time picker | `format`, `allowTime` |
| `toggle` | Boolean switches | `onText`, `offText` |
| `checkbox` | Selection (auto-added) | N/A |
| `password` | Password fields | `showStrength` |
| `userGroup` | Multi-select | `options`, `maxSelections` |

---

## 🎨 Custom Styling

### Override Colors
```tsx
const customConfig = {
    ui: {
        theme: {
            primaryColor: '#8b5cf6',           // Purple
            rowHoverColor: '#f3f4f6',         // Light gray
            selectedRowColor: '#e0e7ff',      // Light blue
            rowIndicatorColor: '#8b5cf6',     // Purple indicator
        },
    },
};

<SimpleAdvancedTable
    config={customConfig}
    // ... other props
/>
```

### Adjust Row Height
```tsx
const compactConfig = {
    ui: {
        defaultRowHeight: 16,  // Extra compact
        compactMode: true,
    },
};
```

### Enable Tree Features
```tsx
const treeConfig = {
    ui: {
        enableTreeView: true,
        showTreeConnectors: true,
        treeIndentSize: 24,
    },
};
```

---

## ⚡ Advanced Features

### Auto-Save Configuration
```tsx
const autoSaveConfig = {
    features: {
        autoSave: true,
        autoSaveDelay: 1000,    // 1 second delay
    },
    ui: {
        showAutoSaveIndicator: true,
        autoSaveIndicatorPosition: 'top-right',
    },
};
```

### Performance for Large Data
```tsx
const performanceConfig = {
    features: {
        virtualScrolling: true,   // For 1000+ rows
        lazyLoading: true,       // Load on scroll
        paginationSize: 100,     // Page size
    },
};
```

### Custom Actions
```tsx
const handleRowAction = (action: string, row: any) => {
    switch (action) {
        case 'edit':
            openEditModal(row);
            break;
        case 'delete':
            deleteRow(row.id);
            break;
        case 'duplicate':
            duplicateRow(row);
            break;
        case 'export':
            exportRow(row);
            break;
        case 'create':
            openCreateModal();
            break;
        default:
            console.log('Custom action:', action, row);
    }
};
```

### Bulk Operations
```tsx
const handleBulkAction = (action: string, selectedRowIds: string[]) => {
    switch (action) {
        case 'delete':
            deleteMultipleRows(selectedRowIds);
            break;
        case 'activate':
            updateMultipleRows(selectedRowIds, { status: 'active' });
            break;
        case 'export':
            exportRows(selectedRowIds);
            break;
        default:
            console.log('Custom bulk action:', action, selectedRowIds);
    }
};
```

---

## 🔄 Migration Examples

### From Basic HTML Table
```tsx
// OLD (Basic HTML)
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        {data.map(row => (
            <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.status}</td>
            </tr>
        ))}
    </tbody>
</table>

// NEW (Advanced Table)
<SimpleAdvancedTable
    tableName="Users"
    columns={[
        { id: 'name', title: 'Name', type: 'text' },
        { id: 'email', title: 'Email', type: 'email' },
        { id: 'status', title: 'Status', type: 'select', options: ['active', 'inactive'] },
    ]}
    data={data}
    onDataChange={setData}
/>
```

### From Complex Custom Table
```tsx
// OLD (1000+ lines of custom code)
// - Custom sorting logic
// - Manual resize handles
// - Complex state management
// - Custom edit modes
// - Manual auto-save

// NEW (10 lines)
<SimpleAdvancedTable
    tableName="Complex Data"
    columns={columns}
    data={data}
    config={{
        features: {
            autoSave: true,
            enableInlineEdit: true,
        }
    }}
    onDataChange={handleDataChange}
    onInlineEdit={handleInlineEdit}
/>
```

---

## 🐛 Troubleshooting

### Table Not Showing
- Check data format: `Array<{id: string, ...}>`
- Verify column `id` matches data properties
- Check console for errors

### Columns Not Resizing
- Ensure `resizable: true` in column config
- Check if `enableColumnResize: true` in config

### Inline Edit Not Working
- Set `editable: true` on columns
- Verify `onInlineEdit` handler is provided
- Check `editTrigger` setting (default: 'doubleClick')

### Auto-Save Not Triggering
- Enable in config: `features: { autoSave: true }`
- Provide `onInlineEdit` handler
- Check `autoSaveDelay` setting

### Tree Not Expanding
- Ensure data has `children` property
- Set `isExpanded: true/false` on parent rows
- Enable in config: `ui: { enableTreeView: true }`

---

## 🎯 Best Practices

1. **Keep column widths reasonable** (80-200px)
2. **Use appropriate column types** for better UX
3. **Enable auto-save** for better user experience
4. **Provide meaningful column titles**
5. **Use tree structure** for hierarchical data
6. **Test with large datasets** if expecting 1000+ rows
7. **Customize colors** to match your brand
8. **Handle errors gracefully** in action handlers

---

This system gives you **enterprise-grade table functionality** with **minimal code** and **maximum consistency** across your entire application! 🚀
