/**
 * Manage Roles Table Configuration
 *
 * Configuration for the role management table with comprehensive
 * field definitions, validations, and interactive features.
 */

const ManageRoles_tableConfig = {
    // Main table configuration
    tableName: 'Manage Roles',

    // Number of subitem tables per row (0 for this use case)
    subitemTableCount: 0,

    // Main table columns configuration
    mainTableColumns: [
        {
            id: 'checkbox',
            title: '',
            type: 'checkbox',
            width: 40,
            resizable: false,
            order: 0,
            pinned: true,
            selectAll: true, // Enable select all functionality
        },
        {
            id: 'roleName',
            title: 'Role Name',
            type: 'text',
            width: 160,
            resizable: true,
            order: 1,
            pinned: false,
            required: true,
            maxLength: 100,
            validation: {
                required: true,
                maxLength: 100,
                pattern: /^[a-zA-Z0-9\s_-]+$/,
                errorMessage:
                    'Role name is required and must contain only alphanumeric characters, spaces, hyphens, or underscores (max 100 characters)',
            },
        },
        {
            id: 'description',
            title: 'Description',
            type: 'textarea',
            width: 220,
            resizable: true,
            order: 2,
            pinned: false,
            required: false,
            maxLength: 500,
            validation: {
                required: false,
                maxLength: 500,
                errorMessage: 'Description must be less than 500 characters',
            },
        },
        {
            id: 'scope',
            title: 'Scope',
            type: 'custom',
            width: 120,
            resizable: true,
            order: 3,
            pinned: false,
            required: false,
            customRenderer: 'scopeConfig',
        },
        {
            id: 'assignedUserGroups',
            title: 'Role Assigned to User Group',
            type: 'custom',
            width: 240,
            resizable: true,
            order: 4,
            pinned: false,
            required: false,
            customRenderer: 'animatedUserGroup',
        },
    ],

    // Features configuration
    features: {
        // Table Capabilities
        create: true,
        read: true,
        update: true,
        delete: true,
        duplicate: true,
        export: true,
        import: true,

        // Search and Filter
        search: true,
        filter: true,
        sort: true,
        groupBy: true,

        // Selection
        multiSelect: true,
        bulkActions: true,

        // Visual Features
        pagination: true,
        resizable: true,
        draggable: true,
        compact: true,

        // Advanced Features
        inlineEditing: true,
        cellValidation: true,
        autoSave: true,
        columnHiding: true,
        columnOrdering: true,

        // UI Enhancements
        modernIcons: true,
        hoverEffects: true,
        animations: true,
        responsiveDesign: true,
    },

    // Pagination settings
    pagination: {
        enabled: true,
        pageSize: 20,
        pageSizeOptions: [10, 20, 50, 100],
        showPageNumbers: true,
        showQuickJumper: true,
        showTotal: true,
    },

    // Sorting configuration
    sorting: {
        enabled: true,
        multiColumn: true,
        defaultSort: [
            {column: 'roleName', direction: 'asc'},
            {column: 'category', direction: 'asc'},
        ],
    },

    // Filtering configuration
    filtering: {
        enabled: true,
        searchPlaceholder: 'Search roles...',
        quickFilters: [
            {key: 'active', label: 'Active Roles', filter: {status: 'active'}},
            {
                key: 'system',
                label: 'System Roles',
                filter: {category: 'system'},
            },
            {
                key: 'business',
                label: 'Business Roles',
                filter: {category: 'business'},
            },
            {
                key: 'recent',
                label: 'Recently Created',
                filter: {createdDate: '7days'},
            },
        ],
        advancedFilters: true,
        filterHistory: true,
    },

    // Grouping configuration
    grouping: {
        enabled: true,
        options: [
            {value: 'scope', label: 'Scope'},
            {value: 'assignedUserGroups', label: 'User Groups'},
        ],
        defaultGroup: null,
        expandAll: false,
        showGroupCounts: true,
    },

    // Bulk actions configuration
    bulkActions: [
        {
            id: 'activate',
            label: 'Activate Selected',
            icon: 'check-circle',
            color: '#10b981',
            action: 'updateStatus',
            params: {status: 'active'},
            confirmMessage: 'Activate selected roles?',
        },
        {
            id: 'deactivate',
            label: 'Deactivate Selected',
            icon: 'x-circle',
            color: '#ef4444',
            action: 'updateStatus',
            params: {status: 'inactive'},
            confirmMessage: 'Deactivate selected roles?',
        },
        {
            id: 'duplicate',
            label: 'Duplicate Selected',
            icon: 'copy',
            color: '#3b82f6',
            action: 'duplicate',
            confirmMessage: 'Duplicate selected roles?',
        },
        {
            id: 'export',
            label: 'Export Selected',
            icon: 'download',
            color: '#6366f1',
            action: 'export',
        },
        {
            id: 'delete',
            label: 'Delete Selected',
            icon: 'trash',
            color: '#ef4444',
            action: 'delete',
            confirmMessage:
                'Are you sure you want to delete the selected roles? This action cannot be undone.',
            danger: true,
        },
    ],

    // Export configuration
    export: {
        enabled: true,
        formats: ['csv', 'xlsx', 'json'],
        defaultFormat: 'xlsx',
        filename: 'roles_export',
        includeFilters: true,
        customFields: true,
    },

    // Import configuration
    import: {
        enabled: true,
        formats: ['csv', 'xlsx', 'json'],
        template: true,
        validation: true,
        preview: true,
        bulkInsert: true,
    },

    // UI Configuration
    ui: {
        theme: 'blue',
        compact: true,
        rowHeight: 'compact', // 'compact', 'normal', 'comfortable'
        density: 'compact',
        padding: 'small',
        fontSize: 'sm',
        borderStyle: 'minimal',
        superCompactMode: true, // Enable super compact mode
        className: 'super-compact-mode', // Add super compact CSS class
        showBorders: true,
        alternatingRows: true,
        hoverEffects: true,
        animations: true,
        modernIcons: true,
        responsiveBreakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200,
        },
    },

    // API endpoints (to be configured based on backend)
    api: {
        list: '/api/roles',
        create: '/api/roles',
        read: '/api/roles/:id',
        update: '/api/roles/:id',
        delete: '/api/roles/:id',
        bulkUpdate: '/api/roles/bulk',
        bulkDelete: '/api/roles/bulk',
        export: '/api/roles/export',
        import: '/api/roles/import',
        search: '/api/roles/search',
        permissions: '/api/permissions',
        categories: '/api/roles/categories',
    },

    // Validation rules
    validation: {
        uniqueFields: ['roleName'],
        requiredFields: ['roleName', 'category', 'status'],
        crossFieldValidation: true,
        realTimeValidation: true,
    },

    // Actions configuration
    actions: {
        // Row-level actions
        row: [
            {
                id: 'save',
                label: 'Save Role',
                icon: 'save',
                type: 'success',
                permission: 'create',
                showOnNew: true, // Only show for new rows
            },
            {
                id: 'cancel',
                label: 'Cancel',
                icon: 'cancel',
                type: 'secondary',
                permission: 'create',
                showOnNew: true, // Only show for new rows
            },
            {
                id: 'edit',
                label: 'Edit Role',
                icon: 'edit',
                type: 'primary',
                permission: 'edit',
                hideOnNew: true, // Hide for new rows
            },
            {
                id: 'duplicate',
                label: 'Duplicate Role',
                icon: 'copy',
                type: 'secondary',
                permission: 'create',
                hideOnNew: true, // Hide for new rows
            },
            {
                id: 'delete',
                label: 'Delete Role',
                icon: 'delete',
                type: 'danger',
                permission: 'delete',
                confirm: true,
                confirmMessage: 'Are you sure you want to delete this role?',
                hideOnNew: true, // Hide for new rows
            },
        ],

        // Bulk actions
        bulk: [
            {
                id: 'bulkEdit',
                label: 'Edit Selected',
                icon: 'edit',
                type: 'primary',
                permission: 'edit',
            },
            {
                id: 'bulkDelete',
                label: 'Delete Selected',
                icon: 'delete',
                type: 'danger',
                permission: 'delete',
                confirm: true,
                confirmMessage:
                    'Are you sure you want to delete the selected roles?',
            },
            {
                id: 'bulkExport',
                label: 'Export Selected',
                icon: 'export',
                type: 'secondary',
                permission: 'read',
            },
        ],
    },

    // Default data for new roles
    defaultValues: {
        status: 'draft',
        category: 'custom',
        permissions: [],
        assignedUsers: 0,
        createdDate: () => new Date().toISOString().split('T')[0],
        lastModified: () => new Date().toISOString(),
    },

    // Default values for ReusableTableComponent compatibility
    defaults: {
        mainItem: {
            roleName: '',
            description: '',
            scope: 'custom',
            assignedUserGroups: [],
        },
        subitem: {
            name: '',
            status: 'active',
        },
    },
};

export default ManageRoles_tableConfig;
